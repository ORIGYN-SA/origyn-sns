//! The burn scraper (spec 7.5 and 8.7). A timer per chain reads the token's `bridgeInfo()` and
//! `BurnedToIcp` logs, and saves every burn exactly once, in burn id order, without gaps.
//!
//! The pure transitions decide what a tick does and change a `ChainState` only when an answer
//! is good. [run_tick] does the calls through an [EvmReader] and commits each answer in one
//! synchronous step. A failed call changes nothing but the failed tick count; the next tick
//! repeats it. A window is finished before a new one opens, so after a failure or an upgrade
//! the next tick goes on with the saved window.

use crate::bridge::alerts::{
    check_stale_cursor, record_tick_failure, record_tick_ok, track_cursor,
};
use crate::bridge::evm::abi::{decode_burn_log, BridgeInfo, DecodedBurn, RawLog};
use crate::bridge::evm::address::format_address;
use crate::bridge::rpc::{EvmReader, RpcError};
use crate::bridge::stable::{with_inbound, with_queue};
use crate::bridge::state::{
    BridgeState, ChainState, Deployment, InboundRecord, Severity, SupplyReading, Window,
};
use crate::state::{mutate_state, read_state};
use alloy_primitives::{hex, U256};
use gldt_swap_common::bridge::{ChainConfig, EvmChain, InboundStatus};
use std::collections::BTreeMap;
use utils::env::Environment;

/// A tick saves at most this many batches (1,000 burns at 50 per batch). A bigger window
/// goes on in the next ticks, so one tick stays well inside the job lease.
pub const MAX_BATCHES_PER_TICK: usize = 20;

const WAITING_FOR_SIGNERS: &str = "waiting for the signer keys to load";

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum TickAction {
    /// No start block yet (spec 7.5).
    FirstTick,
    /// No window is open: read the head, then `bridgeInfo()`.
    OpenWindow,
    /// The next ids of the open window.
    FetchBatch {
        from_block: u64,
        to_block: u64,
        ids: Vec<u64>,
    },
    Stopped,
}

/// What `bridgeInfo()` must show besides the burn id and the supply.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Expected {
    /// The token, which is also its own LayerZero owner.
    pub token: [u8; 20],
    /// The canister's admin address, the token's `adminSigner`.
    pub admin: [u8; 20],
    /// The canister's claims address, the token's `icpSigner`.
    pub claims: [u8; 20],
}

/// Why a chain stopped. Only an SNS `ChainReset` restarts it.
pub type StopReason = String;

/// Why a batch is not saved. Nothing changes, and the next tick asks again.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum BatchError {
    NoWindow,
    /// The ids are not the next ids of the open window, in order.
    NotNextIds,
    /// Not a valid `BurnedToIcp` log of the token.
    BadLog(String),
    /// A log outside the window's blocks.
    OutOfRange {
        burn_id: u64,
        block: u64,
    },
    /// A log for an id that was not asked for.
    Unexpected(u64),
    Duplicate(u64),
    Missing(u64),
}

pub fn next_action(chain: &ChainState, cfg: &ChainConfig) -> TickAction {
    if chain.stopped.is_some() {
        return TickAction::Stopped;
    }
    if chain.start_block.is_none() {
        return TickAction::FirstTick;
    }
    let Some(window) = &chain.window else {
        return TickAction::OpenWindow;
    };
    let first = chain.next_burn_id;
    let end = first
        .saturating_add(u64::from(cfg.log_batch_size))
        .min(window.end_burn_id);
    TickAction::FetchBatch {
        from_block: chain.last_scraped_block.saturating_add(1),
        to_block: window.to_block,
        ids: (first..end).collect(),
    }
}

/// The first tick reads at `head - confirmations`, with no window cap; `None` while the head
/// is below the confirmations.
pub fn first_tick_target(cfg: &ChainConfig, head: u64) -> Option<u64> {
    head.checked_sub(cfg.confirmations)
}

/// `min(head - confirmations, last_scraped_block + max_window_blocks)`, or `None` if that is
/// not past the cursor.
pub fn window_target(chain: &ChainState, cfg: &ChainConfig, head: u64) -> Option<u64> {
    let target = head.saturating_sub(cfg.confirmations).min(
        chain
            .last_scraped_block
            .saturating_add(cfg.max_window_blocks),
    );
    (target > chain.last_scraped_block).then_some(target)
}

fn stop(chain: &mut ChainState, reason: String) -> Result<(), StopReason> {
    chain.stopped = Some(reason.clone());
    Err(reason)
}

/// The owner and both signers must be the token and the canister's own addresses.
fn signer_problem(info: &BridgeInfo, expected: &Expected) -> Option<String> {
    let checks = [
        ("owner", info.owner, expected.token),
        ("adminSigner", info.admin_signer, expected.admin),
        ("icpSigner", info.icp_signer, expected.claims),
    ];
    checks
        .into_iter()
        .find(|(_, got, want)| got != want)
        .map(|(field, got, want)| {
            format!(
                "{field} is {}, expected {}",
                format_address(&got),
                format_address(&want)
            )
        })
}

/// The first tick (spec 7.5): `to_block` becomes the start block if the token shows no burn,
/// no supply, and the expected owner and signers. Otherwise the chain stops.
pub fn apply_first_tick(
    chain: &mut ChainState,
    to_block: u64,
    info: &BridgeInfo,
    expected: &Expected,
) -> Result<(), StopReason> {
    let problem = if info.next_burn_id != 0 {
        Some(format!("nextBurnId is {}, expected 0", info.next_burn_id))
    } else if info.total_supply != U256::ZERO {
        Some(format!("totalSupply is {}, expected 0", info.total_supply))
    } else {
        signer_problem(info, expected)
    };
    if let Some(problem) = problem {
        return stop(chain, format!("first tick at block {to_block}: {problem}"));
    }
    chain.start_block = Some(to_block);
    chain.last_scraped_block = to_block;
    chain.next_burn_id = 0;
    chain.window = None;
    chain.supply = Some(SupplyReading {
        block: to_block,
        total_supply: U256::ZERO,
    });
    Ok(())
}

/// `bridgeInfo()` at `to_block` with no window open. A lower `nextBurnId` than saved means a
/// reorg undid saved burns, and a changed owner or signer is not ours: both stop the chain.
/// No new id moves the cursor and saves the supply; new ids open a window.
pub fn apply_window_open(
    chain: &mut ChainState,
    to_block: u64,
    info: &BridgeInfo,
    expected: &Expected,
) -> Result<(), StopReason> {
    let problem = if info.next_burn_id < chain.next_burn_id {
        Some(format!(
            "nextBurnId {} at block {to_block} is below the saved {} (a reorg undid saved burns)",
            info.next_burn_id, chain.next_burn_id
        ))
    } else {
        signer_problem(info, expected)
    };
    if let Some(problem) = problem {
        return stop(chain, problem);
    }
    if info.next_burn_id == chain.next_burn_id {
        chain.last_scraped_block = to_block;
        chain.supply = Some(SupplyReading {
            block: to_block,
            total_supply: info.total_supply,
        });
    } else {
        chain.window = Some(Window {
            to_block,
            end_burn_id: info.next_burn_id,
            total_supply: info.total_supply,
        });
    }
    Ok(())
}

/// Checks one batch of logs against the open window and, only if every id in `ids` came back
/// exactly once and nothing else did, returns their records in id order and moves the cursor
/// past them. The last batch also closes the window: the cursor moves to its `to_block` and its
/// supply reading is saved. On an error the chain is unchanged.
pub fn apply_batch(
    chain: &mut ChainState,
    evm_chain: EvmChain,
    ids: &[u64],
    logs: &[RawLog],
    token: [u8; 20],
    now: u64,
) -> Result<Vec<InboundRecord>, BatchError> {
    let window = chain.window.clone().ok_or(BatchError::NoWindow)?;
    let first = chain.next_burn_id;
    let next = first.saturating_add(ids.len() as u64);
    let in_order = ids.iter().zip(first..).all(|(id, want)| *id == want);
    if !in_order || (!ids.is_empty() && next > window.end_burn_id) {
        return Err(BatchError::NotNextIds);
    }

    let from_block = chain.last_scraped_block.saturating_add(1);
    let mut found: BTreeMap<u64, (&RawLog, DecodedBurn)> = BTreeMap::new();
    for log in logs {
        let burn = decode_burn_log(log, token).map_err(BatchError::BadLog)?;
        let id = burn.burn_id;
        if log.block_number < from_block || log.block_number > window.to_block {
            return Err(BatchError::OutOfRange {
                burn_id: id,
                block: log.block_number,
            });
        }
        if !(first..next).contains(&id) {
            return Err(BatchError::Unexpected(id));
        }
        if found.insert(id, (log, burn)).is_some() {
            return Err(BatchError::Duplicate(id));
        }
    }
    if let Some(id) = ids.iter().find(|id| !found.contains_key(id)) {
        return Err(BatchError::Missing(*id));
    }

    let token_text = format_address(&token);
    let records = found
        .into_values()
        .map(|(log, burn)| InboundRecord {
            chain: evm_chain,
            token: token_text.clone(),
            burn_id: burn.burn_id,
            tx_hash: format!("0x{}", hex::encode(log.tx_hash)),
            log_index: log.log_index,
            block_number: log.block_number,
            evm_from: format_address(&burn.from),
            to: burn.to,
            amount: burn.amount,
            discovered_at: now,
            status: InboundStatus::Queued,
            created_at_time: None,
        })
        .collect();

    chain.next_burn_id = next;
    if next >= window.end_burn_id {
        chain.last_scraped_block = window.to_block;
        chain.supply = Some(SupplyReading {
            block: window.to_block,
            total_supply: window.total_supply,
        });
        chain.window = None;
    }
    Ok(records)
}

/// Saves new burns of `deployment` in the order given: each record goes into the inbound map
/// and onto the mint queue, and its amount into the unminted total. Every new inbound record is
/// saved here.
pub fn save_burns(state: &mut BridgeState, deployment: Deployment, records: Vec<InboundRecord>) {
    for record in records {
        let key = (deployment, record.burn_id);
        let seq = state.next_queue_seq;
        state.next_queue_seq = seq.checked_add(1).expect("next_queue_seq overflow");
        state.unminted_e8s = state.unminted_e8s.saturating_add(record.amount);
        with_inbound(|m| m.insert(key, record));
        with_queue(|q| q.insert(seq, key));
    }
}

/// Why a tick ended early.
enum Fail {
    /// A call failed: a failed tick.
    Call(String),
    /// A signer key is not loaded yet: noted in `last_error`, not counted.
    Waiting,
    /// Nothing to record: the chain is stopped or not configured, or another tick moved it.
    Skip,
}

impl From<RpcError> for Fail {
    fn from(e: RpcError) -> Self {
        Fail::Call(e.message().to_string())
    }
}

/// One tick of `chain` (spec 8.7). Returns how many burns it saved, so the caller can start
/// the mint processor.
pub async fn run_tick<R: EvmReader>(reader: &R, chain: EvmChain) -> u64 {
    let mut saved = 0;
    let result = tick(reader, chain, &mut saved).await;
    mutate_state(|s| {
        let now = s.env.now_nanos();
        let bridge = &mut s.data.bridge;
        match result {
            Ok(()) => record_tick_ok(bridge, chain, now),
            Err(Fail::Call(e)) => record_tick_failure(bridge, chain, &e, now),
            Err(Fail::Waiting) => {
                if let Some(c) = bridge.chain_state_mut(chain) {
                    c.last_error = Some(WAITING_FOR_SIGNERS.to_string());
                }
            }
            Err(Fail::Skip) => {}
        }
    });
    saved
}

/// The chain as a tick sees it before a call.
struct View {
    cfg: ChainConfig,
    deployment: Deployment,
    chain: ChainState,
    /// `None` while a signer key is not loaded.
    expected: Option<Expected>,
}

fn view(chain: EvmChain) -> Result<View, Fail> {
    read_state(|s| {
        let bridge = &s.data.bridge;
        let deployment = bridge.deployment(chain)?;
        let expected = match (&bridge.admin_signer, &bridge.claims_signer) {
            (Some(admin), Some(claims)) => Some(Expected {
                token: deployment.1,
                admin: admin.address,
                claims: claims.address,
            }),
            _ => None,
        };
        Some(View {
            cfg: bridge.chain_config(chain)?.clone(),
            deployment,
            chain: bridge.chains.get(&deployment)?.clone(),
            expected,
        })
    })
    .ok_or(Fail::Skip)
}

async fn tick<R: EvmReader>(reader: &R, chain: EvmChain, saved: &mut u64) -> Result<(), Fail> {
    let v = view(chain)?;
    match next_action(&v.chain, &v.cfg) {
        TickAction::Stopped => Err(Fail::Skip),
        TickAction::FirstTick => {
            let expected = v.expected.clone().ok_or(Fail::Waiting)?;
            let head = reader.head_block(&v.cfg).await?;
            let to_block = first_tick_target(&v.cfg, head).ok_or_else(|| {
                Fail::Call(format!(
                    "head {head} is below {} confirmations",
                    v.cfg.confirmations
                ))
            })?;
            let info = match reader.bridge_info(&v.cfg, to_block).await {
                Ok(info) => Ok(info),
                // both providers agree that the address does not answer like a GLDT token
                Err(RpcError::BadAnswer(e)) => Err(format!(
                    "first tick at block {to_block}: bridgeInfo() does not decode ({e}), check the token address"
                )),
                Err(e) => return Err(e.into()),
            };
            commit(chain, &v, |c| match info {
                Ok(info) => apply_first_tick(c, to_block, &info, &expected),
                Err(reason) => stop(c, reason),
            })
        }
        TickAction::OpenWindow => {
            let expected = v.expected.clone().ok_or(Fail::Waiting)?;
            let head = reader.head_block(&v.cfg).await?;
            note_head(chain, head.saturating_sub(v.cfg.confirmations));
            let Some(to_block) = window_target(&v.chain, &v.cfg, head) else {
                return Ok(());
            };
            let info = reader.bridge_info(&v.cfg, to_block).await?;
            commit(chain, &v, |c| {
                apply_window_open(c, to_block, &info, &expected)
            })?;
            fetch_batches(reader, chain, saved).await
        }
        TickAction::FetchBatch { to_block, .. } => {
            // the open window's end is a block the chain confirmed
            note_head(chain, to_block);
            fetch_batches(reader, chain, saved).await
        }
    }
}

fn note_head(chain: EvmChain, confirmed_head: u64) {
    mutate_state(|s| {
        let now = s.env.now_nanos();
        check_stale_cursor(&mut s.data.bridge, chain, confirmed_head, now);
    });
}

/// Saves the open window's batches until it closes, a call fails, or
/// [MAX_BATCHES_PER_TICK] batches are saved.
async fn fetch_batches<R: EvmReader>(
    reader: &R,
    chain: EvmChain,
    saved: &mut u64,
) -> Result<(), Fail> {
    for _ in 0..MAX_BATCHES_PER_TICK {
        let v = view(chain)?;
        let TickAction::FetchBatch {
            from_block,
            to_block,
            ids,
        } = next_action(&v.chain, &v.cfg)
        else {
            return Ok(());
        };
        let logs = if ids.is_empty() {
            vec![]
        } else {
            reader.burn_logs(&v.cfg, from_block, to_block, &ids).await?
        };
        *saved += commit_batch(chain, &v, &ids, &logs)?;
    }
    Ok(())
}

/// The chain's state now, if it is where `v` saw it. After the job lease runs out, a second
/// tick of the same chain can move it while this one waits for an answer.
fn current<'a>(bridge: &'a mut BridgeState, v: &View) -> Result<&'a mut ChainState, Fail> {
    match bridge.chains.get_mut(&v.deployment) {
        Some(c)
            if c.start_block == v.chain.start_block
                && c.last_scraped_block == v.chain.last_scraped_block
                && c.next_burn_id == v.chain.next_burn_id
                && c.window == v.chain.window
                && c.stopped == v.chain.stopped =>
        {
            Ok(c)
        }
        _ => Err(Fail::Skip),
    }
}

fn stop_alert(bridge: &mut BridgeState, chain: EvmChain, reason: &str, now: u64) {
    bridge.push_alert(
        now,
        Severity::Critical,
        format!("{chain:?} stopped: {reason}"),
    );
}

/// Applies one answer in one synchronous step. An `Err` from `apply` stops the chain, with a
/// Critical alert.
fn commit(
    chain: EvmChain,
    v: &View,
    apply: impl FnOnce(&mut ChainState) -> Result<(), StopReason>,
) -> Result<(), Fail> {
    mutate_state(|s| {
        let now = s.env.now_nanos();
        let bridge = &mut s.data.bridge;
        let c = current(bridge, v)?;
        let before = (c.last_scraped_block, c.next_burn_id);
        match apply(c) {
            Ok(()) => {
                track_cursor(c, before, now);
                Ok(())
            }
            Err(reason) => {
                stop_alert(bridge, chain, &reason, now);
                Err(Fail::Skip)
            }
        }
    })
}

/// Checks and saves one batch in one synchronous step: the records, the queue and the cursor
/// move together or not at all. Returns how many burns were saved.
fn commit_batch(chain: EvmChain, v: &View, ids: &[u64], logs: &[RawLog]) -> Result<u64, Fail> {
    mutate_state(|s| {
        let now = s.env.now_nanos();
        let bridge = &mut s.data.bridge;
        let c = current(bridge, v)?;
        // a saved burn is never saved again; only a ChainReset that moved the cursor back
        // over saved burns gets here
        let saved_before = ids
            .iter()
            .find(|id| with_inbound(|m| m.contains_key(&(v.deployment, **id))));
        if let Some(id) = saved_before {
            let reason = format!(
                "burn id {id} is already saved, the cursor must not move back over saved burns"
            );
            c.stopped = Some(reason.clone());
            stop_alert(bridge, chain, &reason, now);
            return Err(Fail::Skip);
        }
        let before = (c.last_scraped_block, c.next_burn_id);
        let records = apply_batch(c, chain, ids, logs, v.deployment.1, now)
            .map_err(|e| Fail::Call(format!("batch from burn id {}: {e:?}", before.1)))?;
        track_cursor(c, before, now);
        let count = records.len() as u64;
        save_burns(bridge, v.deployment, records);
        Ok(count)
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::{chain_config, configured_state};
    use crate::bridge::evm::abi::{BridgeInfo, RawLog, BURNED_TO_ICP_TOPIC};
    use crate::bridge::evm::address::parse_address;
    use crate::bridge::evm::principal::encode_icp_principal;
    use crate::bridge::rpc::{EvmReader, RpcError};
    use crate::bridge::stable::{with_inbound, with_queue};
    use crate::bridge::state::{BridgeState, ChainState, EvmSigner, SupplyReading, Window};
    use crate::bridge::test_state::install;
    use crate::state::{mutate_state, read_state, RuntimeState};
    use alloy_primitives::U256;
    use async_trait::async_trait;
    use candid::Principal;
    use futures::executor::block_on;
    use gldt_swap_common::bridge::{ChainConfig, EvmChain, InboundStatus, Severity};
    use icrc_ledger_types::icrc1::account::Account;
    use std::cell::RefCell;

    const CHAIN: EvmChain = EvmChain::Base;
    const ADMIN: [u8; 20] = [0xAD; 20];
    const CLAIMS: [u8; 20] = [0xC1; 20];
    const FROM: [u8; 20] = [0xF0; 20];

    fn cfg() -> ChainConfig {
        chain_config(CHAIN)
    }

    fn token() -> [u8; 20] {
        parse_address(&cfg().token).unwrap()
    }

    fn deployment() -> Deployment {
        (cfg().chain_id, token())
    }

    fn expected() -> Expected {
        Expected {
            token: token(),
            admin: ADMIN,
            claims: CLAIMS,
        }
    }

    fn info(next_burn_id: u64, total_supply: u64) -> BridgeInfo {
        BridgeInfo {
            next_burn_id,
            total_supply: U256::from(total_supply),
            owner: token(),
            admin_signer: ADMIN,
            icp_signer: CLAIMS,
        }
    }

    fn one() -> U256 {
        U256::from(100_000_000u64)
    }

    /// A started chain whose cursor is at `block` and `next_burn_id`, with no window open.
    fn open_chain(block: u64, next_burn_id: u64) -> ChainState {
        ChainState {
            start_block: Some(50),
            last_scraped_block: block,
            next_burn_id,
            supply: Some(SupplyReading {
                block,
                total_supply: U256::from(5u64),
            }),
            cursor_moved_at: Some(0),
            ..Default::default()
        }
    }

    fn with_window(
        mut chain: ChainState,
        to_block: u64,
        end_burn_id: u64,
        supply: u64,
    ) -> ChainState {
        chain.window = Some(Window {
            to_block,
            end_burn_id,
            total_supply: U256::from(supply),
        });
        chain
    }

    fn recipient() -> Account {
        Account {
            owner: Principal::from_slice(&[7; 29]),
            subaccount: None,
        }
    }

    /// The `BurnedToIcp` log of `burn_id`, in a transaction of its own unless two burns share
    /// a block (they then share the transaction hash).
    fn burn_log(burn_id: u64, block: u64, amount: U256) -> RawLog {
        let mut data = Vec::with_capacity(96);
        data.extend_from_slice(&encode_icp_principal(&recipient().owner));
        data.extend_from_slice(&[0u8; 32]);
        data.extend_from_slice(&amount.to_be_bytes::<32>());
        let mut id_word = [0u8; 32];
        id_word[24..].copy_from_slice(&burn_id.to_be_bytes());
        let mut from_word = [0u8; 32];
        from_word[12..].copy_from_slice(&FROM);
        let mut tx_hash = [0u8; 32];
        tx_hash[24..].copy_from_slice(&block.to_be_bytes());
        RawLog {
            address: token(),
            topics: vec![BURNED_TO_ICP_TOPIC, id_word, from_word],
            data,
            block_number: block,
            tx_hash,
            log_index: burn_id,
            removed: false,
        }
    }

    fn log_burn_id(log: &RawLog) -> u64 {
        u64::from_be_bytes(log.topics[1][24..].try_into().unwrap())
    }

    /// An EVM node seen through the reader: the head, `bridgeInfo()`, and every burn log.
    /// It returns the logs of the asked ids newest first, as a provider may.
    struct FakeReader {
        head: RefCell<Result<u64, RpcError>>,
        info: RefCell<Result<BridgeInfo, RpcError>>,
        logs: RefCell<Vec<RawLog>>,
        /// This `burn_logs` call fails, counted from 1.
        fail_logs_call: RefCell<Option<usize>>,
        calls: RefCell<Vec<String>>,
    }

    impl FakeReader {
        fn new(head: u64, info: BridgeInfo) -> Self {
            Self {
                head: RefCell::new(Ok(head)),
                info: RefCell::new(Ok(info)),
                logs: RefCell::new(vec![]),
                fail_logs_call: RefCell::new(None),
                calls: RefCell::new(vec![]),
            }
        }

        fn with_logs(self, logs: Vec<RawLog>) -> Self {
            *self.logs.borrow_mut() = logs;
            self
        }

        fn calls(&self) -> Vec<String> {
            self.calls.borrow().clone()
        }

        fn clear_calls(&self) {
            self.calls.borrow_mut().clear();
        }
    }

    #[async_trait(?Send)]
    impl EvmReader for FakeReader {
        async fn head_block(&self, chain: &ChainConfig) -> Result<u64, RpcError> {
            assert_eq!(chain.chain, CHAIN);
            self.calls.borrow_mut().push("head".to_string());
            self.head.borrow().clone()
        }

        async fn bridge_info(
            &self,
            chain: &ChainConfig,
            block: u64,
        ) -> Result<BridgeInfo, RpcError> {
            assert_eq!(chain.chain, CHAIN);
            self.calls.borrow_mut().push(format!("bridge_info {block}"));
            self.info.borrow().clone()
        }

        async fn burn_logs(
            &self,
            chain: &ChainConfig,
            from_block: u64,
            to_block: u64,
            ids: &[u64],
        ) -> Result<Vec<RawLog>, RpcError> {
            assert_eq!(chain.chain, CHAIN);
            let n = {
                let mut calls = self.calls.borrow_mut();
                calls.push(format!(
                    "burn_logs {from_block}..={to_block} ids {}..={}",
                    ids[0],
                    ids[ids.len() - 1]
                ));
                calls.iter().filter(|c| c.starts_with("burn_logs")).count()
            };
            if *self.fail_logs_call.borrow() == Some(n) {
                return Err(RpcError::Failed(
                    "eth_getLogs: the providers disagree".into(),
                ));
            }
            Ok(self
                .logs
                .borrow()
                .iter()
                .filter(|log| ids.contains(&log_burn_id(log)))
                .filter(|log| (from_block..=to_block).contains(&log.block_number))
                .rev()
                .cloned()
                .collect())
        }
    }

    /// The canister state with the test config, both signers loaded, and empty maps.
    fn setup() {
        let mut bridge = configured_state();
        bridge.claims_signer = Some(EvmSigner {
            public_key: vec![],
            address: CLAIMS,
        });
        bridge.admin_signer = Some(EvmSigner {
            public_key: vec![],
            address: ADMIN,
        });
        let mut state = RuntimeState::default();
        state.data.bridge = bridge;
        install(state);
    }

    fn setup_chain(chain: ChainState) {
        setup();
        mutate_state(|s| *s.data.bridge.chain_state_mut(CHAIN).unwrap() = chain);
    }

    fn bridge() -> BridgeState {
        read_state(|s| s.data.bridge.clone())
    }

    fn chain_state() -> ChainState {
        bridge().chain_state(CHAIN).cloned().unwrap()
    }

    /// The burn ids in the mint queue, in queue order.
    fn queued_ids() -> Vec<u64> {
        with_queue(|q| {
            q.iter()
                .map(|entry| {
                    let (dep, id) = entry.value();
                    assert_eq!(dep, deployment());
                    id
                })
                .collect()
        })
    }

    fn saved_count() -> u64 {
        with_inbound(|m| m.len())
    }

    fn tick(reader: &FakeReader) -> u64 {
        block_on(run_tick(reader, CHAIN))
    }

    #[test]
    fn first_tick_sets_start_block_when_all_zero_and_signers_match() {
        let mut chain = ChainState::default();
        assert_eq!(next_action(&chain, &cfg()), TickAction::FirstTick);
        // Base waits 12 confirmations
        assert_eq!(first_tick_target(&cfg(), 1_000), Some(988));
        assert_eq!(first_tick_target(&cfg(), 11), None);

        apply_first_tick(&mut chain, 988, &info(0, 0), &expected()).unwrap();
        assert_eq!(chain.start_block, Some(988));
        assert_eq!(chain.last_scraped_block, 988);
        assert_eq!(chain.next_burn_id, 0);
        assert_eq!(chain.window, None);
        assert_eq!(
            chain.supply,
            Some(SupplyReading {
                block: 988,
                total_supply: U256::ZERO
            })
        );
        assert_eq!(chain.stopped, None);
        assert_eq!(next_action(&chain, &cfg()), TickAction::OpenWindow);

        // the same through the reader: head, then bridgeInfo() at head minus confirmations
        setup();
        let reader = FakeReader::new(1_000, info(0, 0));
        assert_eq!(tick(&reader), 0);
        assert_eq!(reader.calls(), vec!["head", "bridge_info 988"]);
        let chain = chain_state();
        assert_eq!(chain.start_block, Some(988));
        assert_eq!(chain.last_scraped_block, 988);
        assert_eq!(chain.next_burn_id, 0);
        assert_eq!(chain.stopped, None);
        assert_eq!(chain.failed_ticks, 0);
        assert!(chain.last_ok_at.is_some());
        assert!(chain.cursor_moved_at.is_some());
        assert!(bridge().alerts.is_empty());
        // the other chain is still waiting for its own first tick
        assert_eq!(
            bridge()
                .chain_state(EvmChain::Ethereum)
                .unwrap()
                .start_block,
            None
        );
    }

    #[test]
    fn first_tick_stops_on_nonzero_burn_id_supply_or_signer_mismatch() {
        let cases = [
            (
                BridgeInfo {
                    next_burn_id: 1,
                    ..info(0, 0)
                },
                "nextBurnId",
            ),
            (info(0, 1), "totalSupply"),
            (
                BridgeInfo {
                    owner: [0x01; 20],
                    ..info(0, 0)
                },
                "owner",
            ),
            (
                BridgeInfo {
                    admin_signer: [0x02; 20],
                    ..info(0, 0)
                },
                "adminSigner",
            ),
            (
                BridgeInfo {
                    icp_signer: [0x03; 20],
                    ..info(0, 0)
                },
                "icpSigner",
            ),
        ];
        for (bad, needle) in cases {
            let mut chain = ChainState::default();
            let reason = apply_first_tick(&mut chain, 988, &bad, &expected()).unwrap_err();
            assert!(reason.contains(needle), "{reason}");
            assert_eq!(chain.stopped, Some(reason));
            assert_eq!(chain.start_block, None);
            assert_eq!(next_action(&chain, &cfg()), TickAction::Stopped);

            setup();
            let reader = FakeReader::new(1_000, bad);
            assert_eq!(tick(&reader), 0);
            let chain = chain_state();
            assert!(chain.stopped.as_deref().unwrap().contains(needle));
            assert_eq!(chain.start_block, None);
            let alerts = bridge().alerts;
            assert_eq!(alerts.len(), 1, "{alerts:?}");
            assert_eq!(alerts[0].severity, Severity::Critical);
            assert!(alerts[0].message.contains("Base"), "{}", alerts[0].message);
            assert!(alerts[0].message.contains(needle), "{}", alerts[0].message);

            // a stopped chain is skipped: no call at all
            reader.clear_calls();
            assert_eq!(tick(&reader), 0);
            assert!(reader.calls().is_empty());
            assert_eq!(bridge().alerts.len(), 1);
        }
    }

    #[test]
    fn first_tick_with_an_undecodable_bridge_info_stops_the_chain() {
        // both providers agree, but the address answers nothing a GLDT token would: a typo
        setup();
        let reader = FakeReader::new(1_000, info(0, 0));
        *reader.info.borrow_mut() = Err(RpcError::BadAnswer("bad bridgeInfo() return".into()));
        tick(&reader);
        let chain = chain_state();
        assert!(chain.stopped.as_deref().unwrap().contains("bridgeInfo"));
        assert_eq!(chain.start_block, None);
        assert_eq!(bridge().alerts.len(), 1);
        assert_eq!(bridge().alerts[0].severity, Severity::Critical);
    }

    #[test]
    fn first_tick_waits_for_the_signer_keys_without_calling_out() {
        setup();
        mutate_state(|s| s.data.bridge.admin_signer = None);
        let reader = FakeReader::new(1_000, info(0, 0));
        assert_eq!(tick(&reader), 0);
        assert!(reader.calls().is_empty());
        let chain = chain_state();
        assert_eq!(chain.stopped, None);
        assert_eq!(chain.start_block, None);
        assert_eq!(chain.failed_ticks, 0);
        assert!(chain.last_error.as_deref().unwrap().contains("signer"));

        // once the keys are in, the next tick opens the chain
        mutate_state(|s| {
            s.data.bridge.admin_signer = Some(EvmSigner {
                public_key: vec![],
                address: ADMIN,
            })
        });
        tick(&reader);
        assert_eq!(chain_state().start_block, Some(988));
    }

    #[test]
    fn first_tick_retries_when_the_head_is_below_confirmations() {
        setup();
        let reader = FakeReader::new(11, info(0, 0));
        tick(&reader);
        assert_eq!(reader.calls(), vec!["head"]);
        let chain = chain_state();
        assert_eq!(chain.stopped, None);
        assert_eq!(chain.start_block, None);
        assert_eq!(chain.failed_ticks, 1);
    }

    #[test]
    fn window_target_respects_confirmations_and_500_cap() {
        let chain = open_chain(100, 0);
        // 1_000 - 12 = 988, capped at 100 + 500
        assert_eq!(window_target(&chain, &cfg(), 1_000), Some(600));
        assert_eq!(window_target(&chain, &cfg(), 300), Some(288));
        assert_eq!(window_target(&chain, &cfg(), 113), Some(101));
        // Ethereum waits 3 confirmations
        assert_eq!(
            window_target(&chain, &chain_config(EvmChain::Ethereum), 300),
            Some(297)
        );
    }

    #[test]
    fn window_target_none_when_nothing_new() {
        let chain = open_chain(100, 0);
        // 112 - 12 = 100 is not past the cursor
        assert_eq!(window_target(&chain, &cfg(), 112), None);
        assert_eq!(window_target(&chain, &cfg(), 50), None);
        assert_eq!(window_target(&chain, &cfg(), 0), None);
        let at_end = open_chain(u64::MAX, 0);
        assert_eq!(window_target(&at_end, &cfg(), u64::MAX), None);

        // nothing new: the tick reads the head only, and is a good tick
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(112, info(0, 0));
        tick(&reader);
        assert_eq!(reader.calls(), vec!["head"]);
        let chain = chain_state();
        assert_eq!(chain.last_scraped_block, 100);
        assert_eq!(chain.failed_ticks, 0);
        assert!(chain.last_ok_at.is_some());
    }

    #[test]
    fn no_new_burns_moves_cursor_and_saves_supply_without_window() {
        let mut chain = open_chain(100, 7);
        apply_window_open(&mut chain, 600, &info(7, 42), &expected()).unwrap();
        assert_eq!(chain.last_scraped_block, 600);
        assert_eq!(chain.next_burn_id, 7);
        assert_eq!(chain.window, None);
        assert_eq!(
            chain.supply,
            Some(SupplyReading {
                block: 600,
                total_supply: U256::from(42u64)
            })
        );

        // through the reader: head and one eth_call, no eth_getLogs
        setup_chain(open_chain(100, 7));
        let reader = FakeReader::new(1_000, info(7, 42));
        assert_eq!(tick(&reader), 0);
        assert_eq!(reader.calls(), vec!["head", "bridge_info 600"]);
        let chain = chain_state();
        assert_eq!(chain.last_scraped_block, 600);
        assert_eq!(chain.window, None);
        assert_eq!(
            chain.supply,
            Some(SupplyReading {
                block: 600,
                total_supply: U256::from(42u64)
            })
        );
        assert_eq!(saved_count(), 0);
    }

    #[test]
    fn lower_next_burn_id_stops_chain_as_reorg() {
        let mut chain = open_chain(100, 7);
        let reason = apply_window_open(&mut chain, 600, &info(6, 0), &expected()).unwrap_err();
        assert!(reason.contains("reorg"), "{reason}");
        assert_eq!(chain.stopped, Some(reason));
        assert_eq!(chain.last_scraped_block, 100);
        assert_eq!(chain.next_burn_id, 7);
        assert_eq!(chain.window, None);

        setup_chain(open_chain(100, 7));
        let reader = FakeReader::new(1_000, info(6, 0));
        tick(&reader);
        let chain = chain_state();
        assert!(chain.stopped.as_deref().unwrap().contains("reorg"));
        assert_eq!(chain.last_scraped_block, 100);
        assert_eq!(bridge().alerts.len(), 1);
        assert_eq!(bridge().alerts[0].severity, Severity::Critical);

        reader.clear_calls();
        tick(&reader);
        assert!(reader.calls().is_empty());
    }

    #[test]
    fn signer_change_after_the_start_stops_the_chain() {
        let mut chain = open_chain(100, 7);
        let changed = BridgeInfo {
            icp_signer: [0x99; 20],
            ..info(9, 0)
        };
        let reason = apply_window_open(&mut chain, 600, &changed, &expected()).unwrap_err();
        assert!(reason.contains("icpSigner"), "{reason}");
        assert_eq!(chain.stopped, Some(reason));
        assert_eq!(chain.window, None);
    }

    type ErrorCheck = fn(&BatchError) -> bool;

    #[test]
    fn batch_saved_only_if_every_id_exactly_once() {
        let window_chain = || with_window(open_chain(100, 10), 600, 13, 9);
        let ids = [10, 11, 12];
        let good = vec![
            burn_log(10, 101, one()),
            burn_log(11, 300, one()),
            burn_log(12, 600, one()),
        ];
        let mut removed = good[2].clone();
        removed.removed = true;
        let mut elsewhere = good[2].clone();
        elsewhere.address = [0x0E; 20];

        let cases: Vec<(Vec<RawLog>, ErrorCheck)> = vec![
            // missing
            (vec![good[0].clone(), good[2].clone()], |e| {
                *e == BatchError::Missing(11)
            }),
            (vec![], |e| *e == BatchError::Missing(10)),
            // duplicate
            (
                vec![
                    good[0].clone(),
                    good[1].clone(),
                    good[1].clone(),
                    good[2].clone(),
                ],
                |e| *e == BatchError::Duplicate(11),
            ),
            // extra, inside and outside the window
            (
                vec![
                    good[0].clone(),
                    good[1].clone(),
                    good[2].clone(),
                    burn_log(13, 400, one()),
                ],
                |e| *e == BatchError::Unexpected(13),
            ),
            (
                vec![
                    burn_log(9, 400, one()),
                    good[0].clone(),
                    good[1].clone(),
                    good[2].clone(),
                ],
                |e| *e == BatchError::Unexpected(9),
            ),
            // outside the window's blocks
            (
                vec![good[0].clone(), good[1].clone(), burn_log(12, 601, one())],
                |e| {
                    *e == BatchError::OutOfRange {
                        burn_id: 12,
                        block: 601,
                    }
                },
            ),
            (
                vec![burn_log(10, 100, one()), good[1].clone(), good[2].clone()],
                |e| {
                    *e == BatchError::OutOfRange {
                        burn_id: 10,
                        block: 100,
                    }
                },
            ),
            // not a valid log of the token
            (vec![good[0].clone(), good[1].clone(), removed], |e| {
                matches!(e, BatchError::BadLog(_))
            }),
            (vec![good[0].clone(), good[1].clone(), elsewhere], |e| {
                matches!(e, BatchError::BadLog(_))
            }),
        ];
        for (logs, is_expected_error) in cases {
            let mut chain = window_chain();
            let before = chain.clone();
            let err = apply_batch(&mut chain, CHAIN, &ids, &logs, token(), 5).unwrap_err();
            assert!(is_expected_error(&err), "{err:?}");
            assert_eq!(chain, before);
        }

        // ids that don't continue from the cursor, or pass the window's end
        let mut chain = window_chain();
        assert_eq!(
            apply_batch(&mut chain, CHAIN, &[11, 12], &good[1..], token(), 5),
            Err(BatchError::NotNextIds)
        );
        assert_eq!(
            apply_batch(
                &mut chain,
                CHAIN,
                &[10, 12],
                &[good[0].clone(), good[2].clone()],
                token(),
                5
            ),
            Err(BatchError::NotNextIds)
        );
        let mut more = good.clone();
        more.push(burn_log(13, 600, one()));
        assert_eq!(
            apply_batch(&mut chain, CHAIN, &[10, 11, 12, 13], &more, token(), 5),
            Err(BatchError::NotNextIds)
        );
        assert_eq!(
            apply_batch(&mut open_chain(100, 10), CHAIN, &ids, &good, token(), 5),
            Err(BatchError::NoWindow)
        );
        assert_eq!(chain, window_chain());

        // every id once: saved in id order
        let records = apply_batch(&mut chain, CHAIN, &ids, &good, token(), 5).unwrap();
        assert_eq!(
            records.iter().map(|r| r.burn_id).collect::<Vec<_>>(),
            vec![10, 11, 12]
        );
        assert_eq!(chain.next_burn_id, 13);

        // through the reader, a dropped log saves nothing and fails the tick
        setup_chain(window_chain());
        let reader =
            FakeReader::new(1_000, info(13, 9)).with_logs(vec![good[0].clone(), good[2].clone()]);
        assert_eq!(tick(&reader), 0);
        assert_eq!(saved_count(), 0);
        assert!(queued_ids().is_empty());
        let chain = chain_state();
        assert_eq!(chain.next_burn_id, 10);
        assert_eq!(chain.failed_ticks, 1);
        assert!(chain.last_error.as_deref().unwrap().contains("Missing(11)"));
    }

    #[test]
    fn records_carry_the_log_and_the_decoded_burn() {
        let mut chain = with_window(open_chain(100, 0), 600, 1, 1);
        let log = burn_log(0, 321, one());
        let records = apply_batch(
            &mut chain,
            CHAIN,
            &[0],
            std::slice::from_ref(&log),
            token(),
            77,
        )
        .unwrap();
        let record = &records[0];
        assert_eq!(record.chain, CHAIN);
        assert_eq!(record.token.to_lowercase(), cfg().token.to_lowercase());
        assert_eq!(record.burn_id, 0);
        assert_eq!(
            record.tx_hash,
            format!("0x{}", alloy_primitives::hex::encode(log.tx_hash))
        );
        assert_eq!(record.log_index, 0);
        assert_eq!(record.block_number, 321);
        assert_eq!(
            record.evm_from.to_lowercase(),
            format!("0x{}", "f0".repeat(20))
        );
        assert_eq!(record.to, recipient());
        assert_eq!(record.amount, one());
        assert_eq!(record.discovered_at, 77);
        assert_eq!(record.status, InboundStatus::Queued);
    }

    #[test]
    fn unsorted_logs_across_batch_boundary_are_saved_in_order() {
        // 60 burns; 49 and 50 are in one transaction at block 300, across the batch boundary
        let logs: Vec<RawLog> = (0..60u64)
            .map(|id| {
                let block = match id {
                    49 | 50 => 300,
                    id if id < 49 => 101 + id,
                    id => 400 + id,
                };
                burn_log(id, block, one())
            })
            .collect();
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(1_000, info(60, 77)).with_logs(logs);

        assert_eq!(tick(&reader), 60);
        assert_eq!(
            reader.calls(),
            vec![
                "head",
                "bridge_info 600",
                "burn_logs 101..=600 ids 0..=49",
                "burn_logs 101..=600 ids 50..=59",
            ]
        );
        assert_eq!(queued_ids(), (0..60).collect::<Vec<_>>());
        assert_eq!(saved_count(), 60);
        let r49 = with_inbound(|m| m.get(&(deployment(), 49)).unwrap());
        let r50 = with_inbound(|m| m.get(&(deployment(), 50)).unwrap());
        assert_eq!(r49.tx_hash, r50.tx_hash);
        assert_eq!(r49.block_number, 300);

        let chain = chain_state();
        assert_eq!(chain.next_burn_id, 60);
        assert_eq!(chain.last_scraped_block, 600);
        assert_eq!(chain.window, None);
        assert_eq!(
            chain.supply,
            Some(SupplyReading {
                block: 600,
                total_supply: U256::from(77u64)
            })
        );
        assert_eq!(bridge().next_queue_seq, 60);
    }

    #[test]
    fn last_batch_closes_window_and_commits_supply_reading() {
        let mut chain = with_window(open_chain(100, 0), 600, 3, 77);
        let logs = [
            burn_log(0, 200, one()),
            burn_log(1, 300, one()),
            burn_log(2, 500, one()),
        ];

        // not the last batch: the window stays open, the cursor block and supply stay
        let records = apply_batch(&mut chain, CHAIN, &[0, 1], &logs[..2], token(), 5).unwrap();
        assert_eq!(records.len(), 2);
        assert_eq!(chain.next_burn_id, 2);
        assert!(chain.window.is_some());
        assert_eq!(chain.last_scraped_block, 100);
        assert_eq!(
            chain.supply,
            Some(SupplyReading {
                block: 100,
                total_supply: U256::from(5u64)
            })
        );
        assert_eq!(
            next_action(&chain, &cfg()),
            TickAction::FetchBatch {
                from_block: 101,
                to_block: 600,
                ids: vec![2],
            }
        );

        // the last batch closes it
        apply_batch(&mut chain, CHAIN, &[2], &logs[2..], token(), 5).unwrap();
        assert_eq!(chain.next_burn_id, 3);
        assert_eq!(chain.window, None);
        assert_eq!(chain.last_scraped_block, 600);
        assert_eq!(
            chain.supply,
            Some(SupplyReading {
                block: 600,
                total_supply: U256::from(77u64)
            })
        );
        assert_eq!(next_action(&chain, &cfg()), TickAction::OpenWindow);
    }

    #[test]
    fn batch_with_amount_above_u128_is_saved() {
        let huge = U256::MAX;
        let mut chain = with_window(open_chain(100, 0), 600, 2, 0);
        let logs = [
            burn_log(0, 200, huge),
            burn_log(1, 201, U256::from(1u64) << 200),
        ];
        let records = apply_batch(&mut chain, CHAIN, &[0, 1], &logs, token(), 5).unwrap();
        assert_eq!(records[0].amount, U256::MAX);
        assert_eq!(records[1].amount, U256::from(1u64) << 200);

        // through the reader, with a supply reading of U256::MAX too
        setup_chain(open_chain(100, 0));
        let mut info = info(2, 0);
        info.total_supply = U256::MAX;
        let reader = FakeReader::new(1_000, info).with_logs(logs.to_vec());
        assert_eq!(tick(&reader), 2);
        let saved = with_inbound(|m| m.get(&(deployment(), 0)).unwrap());
        assert_eq!(saved.amount, U256::MAX);
        let chain = chain_state();
        assert_eq!(chain.next_burn_id, 2);
        assert_eq!(chain.supply.unwrap().total_supply, U256::MAX);
    }

    #[test]
    fn rpc_error_changes_nothing_and_counts_failed_tick() {
        let logs: Vec<RawLog> = (0..3).map(|id| burn_log(id, 200 + id, one())).collect();
        // a failed head call, a failed eth_call (both with no window open), and a failed
        // eth_getLogs (window already open)
        for failing in ["head", "bridge_info", "burn_logs"] {
            let start = if failing == "burn_logs" {
                with_window(open_chain(100, 0), 600, 3, 9)
            } else {
                open_chain(100, 0)
            };
            setup_chain(start);
            let reader = FakeReader::new(1_000, info(3, 9)).with_logs(logs.clone());
            let error = RpcError::Failed(format!("{failing} failed: the providers disagree"));
            match failing {
                "head" => *reader.head.borrow_mut() = Err(error),
                "bridge_info" => *reader.info.borrow_mut() = Err(error),
                _ => *reader.fail_logs_call.borrow_mut() = Some(1),
            }
            let before = bridge();

            assert_eq!(tick(&reader), 0);

            let after = bridge();
            let mut expected = before.clone();
            let chain = expected.chain_state_mut(CHAIN).unwrap();
            chain.failed_ticks = 1;
            chain.last_error = after.chain_state(CHAIN).unwrap().last_error.clone();
            assert!(chain.last_error.is_some());
            assert_eq!(after, expected, "{failing}");
            assert_eq!(saved_count(), 0);
            assert!(queued_ids().is_empty());
        }

        // a bridgeInfo() that both providers return but that does not decode is retried
        // after the start (only the first tick stops on it)
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(1_000, info(3, 9));
        *reader.info.borrow_mut() = Err(RpcError::BadAnswer("bad bridgeInfo() return".into()));
        tick(&reader);
        let chain = chain_state();
        assert_eq!(chain.stopped, None);
        assert_eq!(chain.failed_ticks, 1);
        assert_eq!(chain.window, None);
    }

    #[test]
    fn open_window_resumes_after_failure_mid_batches() {
        let logs: Vec<RawLog> = (0..120).map(|id| burn_log(id, 101 + id, one())).collect();
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(1_000, info(120, 7)).with_logs(logs);
        *reader.fail_logs_call.borrow_mut() = Some(2);

        // batch 1 is saved, batch 2 fails: the window stays open at id 50
        assert_eq!(tick(&reader), 50);
        let chain = chain_state();
        assert_eq!(chain.next_burn_id, 50);
        assert_eq!(chain.last_scraped_block, 100);
        assert_eq!(
            chain.window,
            Some(Window {
                to_block: 600,
                end_burn_id: 120,
                total_supply: U256::from(7u64)
            })
        );
        assert_eq!(chain.failed_ticks, 1);
        assert_eq!(queued_ids(), (0..50).collect::<Vec<_>>());

        // the next tick goes on with id 50, without reading the head or bridgeInfo() again
        reader.clear_calls();
        *reader.fail_logs_call.borrow_mut() = None;
        assert_eq!(tick(&reader), 70);
        assert_eq!(
            reader.calls(),
            vec![
                "burn_logs 101..=600 ids 50..=99",
                "burn_logs 101..=600 ids 100..=119",
            ]
        );
        let chain = chain_state();
        assert_eq!(chain.next_burn_id, 120);
        assert_eq!(chain.last_scraped_block, 600);
        assert_eq!(chain.window, None);
        assert_eq!(chain.failed_ticks, 0);
        assert_eq!(queued_ids(), (0..120).collect::<Vec<_>>());
    }

    #[test]
    fn open_window_resumes_after_an_upgrade() {
        let logs: Vec<RawLog> = (0..120).map(|id| burn_log(id, 101 + id, one())).collect();
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(1_000, info(120, 7)).with_logs(logs);
        *reader.fail_logs_call.borrow_mut() = Some(2);
        assert_eq!(tick(&reader), 50);

        // an upgrade serializes the heap state; the maps stay in stable memory
        let mut bytes = Vec::new();
        bity_ic_serializer::serialize(&bridge(), &mut bytes).unwrap();
        let restored: BridgeState = bity_ic_serializer::deserialize(bytes.as_slice()).unwrap();
        assert_eq!(restored, bridge());
        mutate_state(|s| s.data.bridge = restored);

        reader.clear_calls();
        *reader.fail_logs_call.borrow_mut() = None;
        assert_eq!(tick(&reader), 70);
        assert_eq!(reader.calls()[0], "burn_logs 101..=600 ids 50..=99");
        assert_eq!(chain_state().next_burn_id, 120);
        assert_eq!(queued_ids(), (0..120).collect::<Vec<_>>());
    }

    #[test]
    fn a_tick_fetches_a_bounded_number_of_batches() {
        let total = (MAX_BATCHES_PER_TICK as u64 + 2) * 50;
        let logs: Vec<RawLog> = (0..total)
            .map(|id| burn_log(id, 101 + id % 400, one()))
            .collect();
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(1_000, info(total, 7)).with_logs(logs);

        assert_eq!(tick(&reader), MAX_BATCHES_PER_TICK as u64 * 50);
        let chain = chain_state();
        assert_eq!(chain.next_burn_id, MAX_BATCHES_PER_TICK as u64 * 50);
        assert!(chain.window.is_some());
        assert_eq!(chain.failed_ticks, 0);

        assert_eq!(tick(&reader), 100);
        assert_eq!(chain_state().next_burn_id, total);
        assert_eq!(chain_state().window, None);
    }

    #[test]
    fn a_burn_id_saved_before_is_never_saved_again() {
        // a ChainReset that moves next_burn_id back must not queue a burn twice
        setup_chain(with_window(open_chain(100, 0), 600, 2, 1));
        let reader = FakeReader::new(1_000, info(2, 1))
            .with_logs(vec![burn_log(0, 200, one()), burn_log(1, 201, one())]);
        assert_eq!(tick(&reader), 2);
        mutate_state(|s| {
            *s.data.bridge.chain_state_mut(CHAIN).unwrap() =
                with_window(open_chain(100, 0), 600, 2, 1)
        });

        assert_eq!(tick(&reader), 0);
        assert_eq!(queued_ids(), vec![0, 1]);
        let chain = chain_state();
        assert!(chain.stopped.as_deref().unwrap().contains("already saved"));
        assert_eq!(chain.next_burn_id, 0);
        assert_eq!(bridge().alerts.back().unwrap().severity, Severity::Critical);
    }

    #[test]
    fn five_failed_ticks_raise_alert() {
        setup_chain(open_chain(100, 0));
        let reader = FakeReader::new(1_000, info(0, 0));
        *reader.head.borrow_mut() = Err(RpcError::Failed("head call: timeout".into()));
        for n in 1..=4 {
            tick(&reader);
            assert_eq!(chain_state().failed_ticks, n);
            assert!(bridge().alerts.is_empty());
        }
        tick(&reader);
        assert_eq!(chain_state().failed_ticks, 5);
        let alerts = bridge().alerts;
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].severity, Severity::Warning);
        assert!(
            alerts[0].message.contains("timeout"),
            "{}",
            alerts[0].message
        );

        tick(&reader);
        assert_eq!(bridge().alerts.len(), 1);

        // a good tick starts the count again
        *reader.head.borrow_mut() = Ok(1_000);
        tick(&reader);
        assert_eq!(chain_state().failed_ticks, 0);
    }
}
