//! EVM to ICP (spec 8.8): the mint processor and the supply guard.
//!
//! The scraper saves each burn as `Queued` in map 2 and on the mint queue (map 3), and adds its
//! amount to `unminted_e8s`. Each `bridge_process` round first retries every mint whose outcome
//! is unknown, with its stored arguments, and then (after the outbound half) mints the queue in
//! order, one at a time. While a mint's outcome is still unknown, no new mint goes out, so a
//! ledger outage leaves at most one transfer to settle. Before each new mint:
//!
//! - rule 1: the burn is not above `bridged_out`;
//! - the supply guard: the chains' supply readings plus `unminted_e8s` are not above
//!   `bridged_out`, in U256 with saturating sums, so a saturated sum holds.
//!
//! The first check that fails stops the run and alerts once; minting resumes by itself when the
//! numbers line up. The memo and `created_at_time` are fixed, and the record marked
//! `MintUnknown`, before the ledger call. So a call with no answer, or a trap after it, is retried
//! with byte-identical arguments, and the ledger answers `Duplicate` if it minted. A result is
//! applied only while the record is `Queued` or `MintUnknown`, so the counters move once.

use crate::bridge::alerts::track_mint_hold;
use crate::bridge::evm::num::u256_to_nat;
use crate::bridge::outbound::MAX_TRANSFERS_PER_PAGE;
use crate::bridge::stable::{with_inbound, with_queue, InboundKey};
use crate::bridge::state::{BridgeState, InboundRecord, MintHold, Severity};
use crate::state::mutate_state;
use alloy_primitives::U256;
use async_trait::async_trait;
use candid::{Nat, Principal};
use gldt_swap_common::bridge::{EvmChain, InboundStatus, InboundTransfer};
pub use icrc_ledger_canister::icrc1_transfer::Response as TransferResponse;
use icrc_ledger_canister_c2c_client::icrc1_transfer;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{Memo, TransferArg, TransferError};
use tracing::{info, warn};
use utils::env::Environment;

/// The mint memo is these 7 bytes, the chain id and the burn id, both big endian.
pub const IN_MEMO_PREFIX: &[u8; 7] = b"GLDT-IN";

/// A run sends at most this many new mints; the next run goes on. It keeps a run well inside
/// the job lease.
pub const MAX_MINTS_PER_RUN: usize = 100;

/// What the mint queue does next.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MintDecision {
    Mint(InboundKey),
    HoldGuard,
    HoldRule1,
    /// A mint's outcome is still unknown; it settles before the next one goes out.
    HoldUnknown,
    Paused,
    Empty,
}

/// The ledger's answer to a mint, as [apply_mint_result] uses it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum MintResult {
    /// Minted at this block index.
    Ok(u64),
    /// An earlier call with the same arguments minted at this block index.
    Duplicate(u64),
    /// No answer that settles it: the same call is retried later.
    NoAnswer,
    /// The ledger's deduplication window passed while the outcome was unknown.
    TooOld,
    /// The ledger refused the first call, so nothing was minted.
    Refused(TransferError),
}

/// The GLDT ledger's `icrc1_transfer`, as the processor sees it.
#[async_trait(?Send)]
pub trait Minter {
    /// `None` when the call got no reply.
    async fn transfer(&self, args: TransferArg) -> Option<TransferResponse>;
}

/// Mints on the ledger from the canister, its minting account.
pub struct IcMinter {
    pub ledger: Principal,
}

#[async_trait(?Send)]
impl Minter for IcMinter {
    async fn transfer(&self, args: TransferArg) -> Option<TransferResponse> {
        let reply = icrc1_transfer(self.ledger, &args)
            .await
            .map_err(|e| warn!(error = ?e, "inbound mint got no reply"))
            .ok();
        #[cfg(feature = "inttest")]
        if crate::bridge::test_hooks::take_lost_reply(crate::bridge::test_hooks::LedgerCall::Mint) {
            warn!(?reply, "inbound mint answer dropped by the test hook");
            return None;
        }
        reply
    }
}

/// `b"GLDT-IN"`, the chain id and the burn id, big endian: 23 bytes.
pub fn in_memo(chain_id: u64, burn_id: u64) -> Memo {
    let mut memo = IN_MEMO_PREFIX.to_vec();
    memo.extend_from_slice(&chain_id.to_be_bytes());
    memo.extend_from_slice(&burn_id.to_be_bytes());
    Memo::from(memo)
}

/// The EVM side of the supply guard: the supply reading of each configured chain's current
/// deployment, plus `unminted`. The sum saturates.
pub fn evm_side(state: &BridgeState, unminted: U256) -> U256 {
    state
        .config
        .iter()
        .flat_map(|c| &c.chains)
        .filter_map(|cfg| state.chain_state(cfg.chain)?.supply.as_ref())
        .fold(unminted, |sum, reading| {
            sum.saturating_add(reading.total_supply)
        })
}

/// True while the supply guard holds minting: [evm_side] is above `bridged_out`. A saturated
/// sum always holds.
pub fn guard_holds(state: &BridgeState, unminted_total: U256) -> bool {
    evm_side(state, unminted_total) > U256::from(state.bridged_out)
}

/// Every inbound burn that is not `Minted` or `Rejected`, counted from map 2. Saturating.
pub fn count_unminted() -> U256 {
    with_inbound(|m| {
        m.iter()
            .map(|entry| entry.value())
            .filter(|r| {
                !matches!(
                    r.status,
                    InboundStatus::Minted { .. } | InboundStatus::Rejected(_)
                )
            })
            .fold(U256::ZERO, |sum, r| sum.saturating_add(r.amount))
    })
}

/// Takes `amount` off `unminted_e8s` when a record has become `Minted` or `Rejected` (stored
/// first). A saturated total, or one below `amount`, can't be lowered by subtraction: it is
/// counted again from map 2, so a forged burn leaving never hides others that still saturate.
pub fn release_unminted(state: &mut BridgeState, amount: U256) {
    state.unminted_e8s = if state.unminted_e8s == U256::MAX || state.unminted_e8s < amount {
        count_unminted()
    } else {
        state.unminted_e8s.saturating_sub(amount)
    };
}

/// Spec 8.8 for the head of the mint queue. A `MintUnknown` head holds new mints until it
/// settles; a `NeedsManualCheck` has left the queue and holds nothing. For a `Queued` head:
/// rule 1 first (it needs no reading), then the supply guard.
pub fn next_mint(state: &BridgeState) -> MintDecision {
    let Some((key, record)) = queue_head() else {
        return MintDecision::Empty;
    };
    if record.status == InboundStatus::MintUnknown {
        return MintDecision::HoldUnknown;
    }
    if state.paused_in {
        return MintDecision::Paused;
    }
    if record.amount > U256::from(state.bridged_out) {
        return MintDecision::HoldRule1;
    }
    if guard_holds(state, state.unminted_e8s) {
        return MintDecision::HoldGuard;
    }
    MintDecision::Mint(key)
}

/// The first record on the mint queue, which holds only `Queued` and `MintUnknown` records.
fn queue_head() -> Option<(InboundKey, InboundRecord)> {
    with_queue(|q| {
        q.iter().find_map(|entry| {
            let key = entry.value();
            let record = with_inbound(|m| m.get(&key))?;
            matches!(
                record.status,
                InboundStatus::Queued | InboundStatus::MintUnknown
            )
            .then_some((key, record))
        })
    })
}

/// The `MintUnknown` records, in queue order. They come before the first `Queued` one: mints
/// go out in queue order, and a record leaves the queue once settled.
fn unknown_keys() -> Vec<InboundKey> {
    with_queue(|q| {
        q.iter()
            .map(|entry| entry.value())
            .map(|key| (key, with_inbound(|m| m.get(&key)).map(|r| r.status)))
            .take_while(|(_, status)| *status != Some(InboundStatus::Queued))
            .filter(|(_, status)| *status == Some(InboundStatus::MintUnknown))
            .map(|(key, _)| key)
            .collect()
    })
}

/// The mint: `icrc1_transfer` from the minting account (`from_subaccount: None`), built only
/// from the key, the stored record and its fixed `created_at_time`.
pub fn mint_args(key: &InboundKey, record: &InboundRecord, created_at_time: u64) -> TransferArg {
    TransferArg {
        from_subaccount: None,
        to: record.to,
        fee: None,
        created_at_time: Some(created_at_time),
        memo: Some(in_memo(key.0 .0, key.1)),
        amount: u256_to_nat(record.amount),
    }
}

/// The synchronous step before a mint call. The first attempt fixes `created_at_time`, and the
/// record is stored as `MintUnknown` before the call, so a trap after it leaves a retry with the
/// same arguments. Returns the arguments, and whether an earlier call with them may have minted.
///
/// `None` when nothing is to be sent: the record is not `Queued` or `MintUnknown`, or it is
/// quarantined here because it would mint to the anonymous principal or to the minting
/// account (still counted as unminted; an SNS resolve decides).
pub fn begin_mint(
    state: &mut BridgeState,
    key: InboundKey,
    minting_owner: Principal,
    now: u64,
) -> Option<(TransferArg, bool)> {
    let mut record = with_inbound(|m| m.get(&key))?;
    match record.status {
        InboundStatus::Queued => {
            if let Some(reason) = bad_destination(&record.to, minting_owner) {
                quarantine(state, key, &mut record, reason, now);
                return None;
            }
        }
        InboundStatus::MintUnknown => {}
        _ => return None,
    }
    let retry = record.created_at_time.is_some();
    let created_at_time = *record.created_at_time.get_or_insert(now);
    record.status = InboundStatus::MintUnknown;
    store_inbound(state, key, &record);
    Some((mint_args(&key, &record, created_at_time), retry))
}

fn bad_destination(to: &Account, minting_owner: Principal) -> Option<String> {
    if to.owner == Principal::anonymous() {
        Some("the destination is the anonymous principal, which nobody controls".to_string())
    } else if *to == Account::from(minting_owner) {
        Some("the destination is the ledger's minting account".to_string())
    } else {
        None
    }
}

fn quarantine(
    state: &mut BridgeState,
    key: InboundKey,
    record: &mut InboundRecord,
    reason: String,
    now: u64,
) {
    state.push_alert(
        now,
        Severity::Warning,
        format!(
            "inbound {:?} burn {} quarantined, resolve by SNS: {reason}",
            record.chain, record.burn_id
        ),
    );
    record.status = InboundStatus::Quarantined(reason);
    store_inbound(state, key, record);
}

/// Reads the ledger's reply (`None` when the call got no reply). `retry` is true when an earlier
/// call with the same arguments may have minted.
///
/// The ledger checks its throttle, `TooOld`, `CreatedInFuture` and the fee before its
/// deduplication lookup, so on a retry only `TooOld` settles anything besides `Ok` and
/// `Duplicate`: every other refusal leaves the outcome unknown. A retry is never quarantined,
/// because a quarantined burn may be minted again by an SNS resolve. On the first call a refusal
/// is final, except `TemporarilyUnavailable` (spec 8.8).
pub fn classify_mint(reply: Option<TransferResponse>, retry: bool) -> MintResult {
    use TransferError as E;
    match reply {
        None => MintResult::NoAnswer,
        Some(Ok(index)) => block_index(&index).map_or(MintResult::NoAnswer, MintResult::Ok),
        Some(Err(E::Duplicate { duplicate_of })) => {
            block_index(&duplicate_of).map_or(MintResult::NoAnswer, MintResult::Duplicate)
        }
        Some(Err(E::TemporarilyUnavailable)) => MintResult::NoAnswer,
        Some(Err(E::TooOld)) if retry => MintResult::TooOld,
        Some(Err(_)) if retry => MintResult::NoAnswer,
        Some(Err(e)) => MintResult::Refused(e),
    }
}

fn block_index(n: &Nat) -> Option<u64> {
    u64::try_from(&n.0).ok()
}

/// Applies a mint result to a record that is `Queued` or `MintUnknown` and returns it updated.
/// Any other status is left alone (`None`), so a late or repeated answer never moves the
/// counters twice.
///
/// - `Ok` or `Duplicate`: `Minted`, `bridged_out` down (checked), the unminted total down.
/// - `NoAnswer`: `MintUnknown`, retried with the same arguments.
/// - `TooOld`: `NeedsManualCheck` with a Critical alert; still unminted.
/// - `Refused`: `Quarantined`; still unminted.
pub fn apply_mint_result(
    state: &mut BridgeState,
    key: InboundKey,
    result: MintResult,
    now: u64,
) -> Option<InboundRecord> {
    let mut record = with_inbound(|m| m.get(&key))?;
    if !matches!(
        record.status,
        InboundStatus::Queued | InboundStatus::MintUnknown
    ) {
        info!(burn_id = key.1, status = ?record.status, ?result, "inbound mint result ignored, already settled");
        return None;
    }
    let (chain, burn_id) = (record.chain, record.burn_id);
    match result {
        MintResult::Ok(index) | MintResult::Duplicate(index) => {
            // rule 1 held it to `bridged_out`, a u128, before the first call
            let amount = u128::try_from(record.amount)
                .unwrap_or_else(|_| panic!("inbound {chain:?} burn {burn_id} minted above u128"));
            record.status = InboundStatus::Minted {
                icp_block_index: index,
            };
            store_inbound(state, key, &record);
            state.sub_bridged_out(amount);
            release_unminted(state, record.amount);
        }
        MintResult::NoAnswer => {
            record.status = InboundStatus::MintUnknown;
            store_inbound(state, key, &record);
        }
        MintResult::TooOld => {
            // never retried with a new timestamp here: the mint may have happened
            let reason = format!(
                "the ledger's deduplication window passed before the mint outcome was known; \
                 look for memo GLDT-IN {} {burn_id} to {} in the ledger, then resolve by SNS",
                key.0 .0, record.to
            );
            state.push_alert(
                now,
                Severity::Critical,
                format!("inbound {chain:?} burn {burn_id} needs a manual check: {reason}"),
            );
            record.status = InboundStatus::NeedsManualCheck(reason);
            store_inbound(state, key, &record);
        }
        MintResult::Refused(e) => {
            let reason = format!("the ledger refused the mint: {e}");
            quarantine(state, key, &mut record, reason, now);
        }
    }
    Some(record)
}

/// Stores `record` in map 2 and keeps the queue and `inbound_held` in step with its status:
/// `Queued` and `MintUnknown` stay queued, `Quarantined` and `NeedsManualCheck` leave the queue
/// and are held for an SNS resolve, `Minted` and `Rejected` leave both. Putting a record back on
/// the queue takes a new sequence number, which is the caller's.
pub fn store_inbound(state: &mut BridgeState, key: InboundKey, record: &InboundRecord) {
    with_inbound(|m| m.insert(key, record.clone()));
    match record.status {
        InboundStatus::Queued | InboundStatus::MintUnknown => {
            state.inbound_held.remove(&key);
        }
        InboundStatus::Quarantined(_) | InboundStatus::NeedsManualCheck(_) => {
            dequeue(key);
            state.inbound_held.insert(key);
        }
        InboundStatus::Minted { .. } | InboundStatus::Rejected(_) => {
            dequeue(key);
            state.inbound_held.remove(&key);
        }
    }
}

fn dequeue(key: InboundKey) {
    let seq = with_queue(|q| q.iter().find(|e| e.value() == key).map(|e| *e.key()));
    if let Some(seq) = seq {
        with_queue(|q| q.remove(&seq));
    }
}

/// Whether the processor has inbound work: anything on the mint queue.
pub fn has_inbound_work() -> bool {
    with_queue(|q| !q.is_empty())
}

/// The burn `burn_id` on `chain`'s current token.
pub fn transfer_in(state: &BridgeState, chain: EvmChain, burn_id: u64) -> Option<InboundTransfer> {
    let deployment = state.deployment(chain)?;
    with_inbound(|m| m.get(&(deployment, burn_id))).map(|r| r.to_candid())
}

/// The saved burns of transaction `tx_hash` on `chain` (any token it had), in burn id order.
/// Lookup only: a burn the scraper has not saved yet is not found.
pub fn transfers_in_by_tx(
    state: &BridgeState,
    chain: EvmChain,
    tx_hash: &str,
) -> Vec<InboundTransfer> {
    let Some(chain_id) = state.chain_config(chain).map(|c| c.chain_id) else {
        return Vec::new();
    };
    with_inbound(|m| {
        m.range(((chain_id, [0u8; 20]), 0)..)
            .take_while(|e| e.key().0 .0 == chain_id)
            .map(|e| e.value())
            .filter(|r| r.tx_hash.eq_ignore_ascii_case(tx_hash))
            .map(|r| r.to_candid())
            .collect()
    })
}

/// The inbound transfers to `account`, newest first (by discovery time, then chain id, token and
/// burn id). `start` skips that many of them, the number already shown; `None` starts at the
/// newest. At most [MAX_TRANSFERS_PER_PAGE] are returned. A burn found between two calls
/// shifts the later pages by one.
pub fn transfers_in_by_account(
    account: &Account,
    start: Option<u64>,
    limit: u32,
) -> Vec<InboundTransfer> {
    let limit = limit.min(MAX_TRANSFERS_PER_PAGE) as usize;
    if limit == 0 {
        return Vec::new();
    }
    let skip = usize::try_from(start.unwrap_or(0)).unwrap_or(usize::MAX);
    let mut found: Vec<(u64, InboundKey, InboundRecord)> = with_inbound(|m| {
        m.iter()
            .filter_map(|e| {
                let record = e.value();
                (record.to == *account).then(|| (record.discovered_at, *e.key(), record))
            })
            .collect()
    });
    found.sort_by(|a, b| (b.0, b.1).cmp(&(a.0, a.1)));
    found
        .into_iter()
        .skip(skip)
        .take(limit)
        .map(|(_, _, r)| r.to_candid())
        .collect()
}

/// The first inbound step of `bridge_process`: retries every mint whose outcome is unknown with
/// its stored arguments. It runs while paused too (spec 8.10), and checks neither rule 1 nor the
/// guard: these mints passed them before their first call.
pub async fn settle_unknown_mints<M: Minter>(minter: &M, minting_owner: Principal) {
    for key in unknown_keys() {
        let start = mutate_state(|s| {
            let now = s.env.now_nanos();
            begin_mint(&mut s.data.bridge, key, minting_owner, now)
        });
        if let Some((args, retry)) = start {
            mint_once(minter, key, args, retry).await;
        }
    }
}

/// The last inbound step of `bridge_process`: mints the queue in order, one at a time, until it
/// is empty, a check holds, a mint's outcome is unknown, minting is paused, or
/// [MAX_MINTS_PER_RUN] mints went out. An unknown outcome raises no alert of its own: the
/// no-answer path logs, and `NeedsManualCheck` alerts.
pub async fn mint_queue<M: Minter>(minter: &M, minting_owner: Principal) {
    for _ in 0..MAX_MINTS_PER_RUN {
        let start = mutate_state(|s| {
            let now = s.env.now_nanos();
            let bridge = &mut s.data.bridge;
            let hold = match next_mint(bridge) {
                MintDecision::Mint(key) => {
                    track_mint_hold(bridge, None, now);
                    return Some(
                        begin_mint(bridge, key, minting_owner, now).map(|start| (key, start)),
                    );
                }
                MintDecision::Paused | MintDecision::HoldUnknown => return None,
                MintDecision::Empty => None,
                MintDecision::HoldGuard => Some(MintHold::Guard),
                MintDecision::HoldRule1 => Some(MintHold::Rule1),
            };
            track_mint_hold(bridge, hold, now);
            None
        });
        let Some(start) = start else {
            return;
        };
        // quarantined without a ledger call: the next burn goes on
        let Some((key, (args, retry))) = start else {
            continue;
        };
        if mint_once(minter, key, args, retry).await == MintResult::NoAnswer {
            return;
        }
    }
}

/// One `bridge_process` round (spec 8.8): settles the mints whose outcome is unknown, runs
/// `outbound` (the outbound half), then mints the queue, which waits while a mint is still
/// unknown. `minter` is `None` when the GLDT ledger is not known: only `outbound` runs.
pub async fn process_round<M: Minter>(
    minter: Option<&M>,
    minting_owner: Principal,
    outbound: impl std::future::Future<Output = ()>,
) {
    if let Some(minter) = minter {
        settle_unknown_mints(minter, minting_owner).await;
    }
    outbound.await;
    if let Some(minter) = minter {
        mint_queue(minter, minting_owner).await;
    }
}

async fn mint_once<M: Minter>(
    minter: &M,
    key: InboundKey,
    args: TransferArg,
    retry: bool,
) -> MintResult {
    let result = classify_mint(minter.transfer(args).await, retry);
    info!(
        chain_id = key.0 .0,
        burn_id = key.1,
        retry,
        ?result,
        "inbound mint answered"
    );
    mutate_state(|s| {
        let now = s.env.now_nanos();
        apply_mint_result(&mut s.data.bridge, key, result.clone(), now)
    });
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::configured_state;
    use crate::bridge::scraper::save_burns;
    use crate::bridge::stable::{with_inbound, with_queue, InboundKey};
    use crate::bridge::state::{BridgeState, Deployment, InboundRecord, SupplyReading};
    use crate::bridge::test_state::install;
    use crate::state::{mutate_state, read_state, RuntimeState};
    use alloy_primitives::U256;
    use async_trait::async_trait;
    use candid::{Encode, Nat, Principal};
    use futures::executor::block_on;
    use gldt_swap_common::bridge::{EvmChain, InboundStatus, Severity};
    use icrc_ledger_types::icrc1::account::Account;
    use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
    use std::cell::RefCell;
    use std::collections::VecDeque;

    /// 1 GLDT.
    const ONE: u128 = 100_000_000;
    const CHAIN: EvmChain = EvmChain::Base;

    fn minting_owner() -> Principal {
        Principal::from_slice(&[0x5f; 10])
    }

    fn user() -> Account {
        Account::from(Principal::from_slice(&[7; 29]))
    }

    fn e8s(n: u128) -> U256 {
        U256::from(n)
    }

    /// The canister state with the test config, `bridged_out` and a Base supply reading, and
    /// empty maps.
    fn setup(bridged_out: u128, base_supply: u128) {
        let mut bridge = configured_state();
        bridge.bridged_out = bridged_out;
        bridge.chain_state_mut(CHAIN).unwrap().supply = Some(SupplyReading {
            block: 100,
            total_supply: e8s(base_supply),
        });
        let mut state = RuntimeState::default();
        state.data.bridge = bridge;
        install(state);
    }

    fn deployment() -> Deployment {
        read_state(|s| s.data.bridge.deployment(CHAIN).unwrap())
    }

    fn key(burn_id: u64) -> InboundKey {
        (deployment(), burn_id)
    }

    fn tx_hash(n: u64) -> String {
        format!("0x{:064x}", 0xabc0 + n)
    }

    fn burn(burn_id: u64, amount: U256, to: Account) -> InboundRecord {
        InboundRecord {
            chain: CHAIN,
            token: "0x00000000000000000000000000000000000B1D6E".to_string(),
            burn_id,
            tx_hash: tx_hash(burn_id),
            log_index: burn_id,
            block_number: 200 + burn_id,
            evm_from: "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string(),
            to,
            amount,
            discovered_at: 1_000 + burn_id,
            status: InboundStatus::Queued,
            created_at_time: None,
        }
    }

    /// Saves burns the way the scraper does: map 2, the queue and the unminted total.
    fn save(records: Vec<InboundRecord>) {
        mutate_state(|s| {
            let deployment = s.data.bridge.deployment(CHAIN).unwrap();
            save_burns(&mut s.data.bridge, deployment, records)
        });
    }

    fn record(burn_id: u64) -> InboundRecord {
        with_inbound(|m| m.get(&key(burn_id))).expect("saved burn")
    }

    fn status(burn_id: u64) -> InboundStatus {
        record(burn_id).status
    }

    fn bridge() -> BridgeState {
        read_state(|s| s.data.bridge.clone())
    }

    fn queued_ids() -> Vec<u64> {
        with_queue(|q| q.iter().map(|e| e.value().1).collect())
    }

    fn decision() -> MintDecision {
        read_state(|s| next_mint(&s.data.bridge))
    }

    fn alerts_with(text: &str) -> Vec<(Severity, String)> {
        bridge()
            .alerts
            .iter()
            .filter(|a| a.message.contains(text))
            .map(|a| (a.severity, a.message.clone()))
            .collect()
    }

    /// The ledger seen through [Minter]. Replies come from the script in order; once it is
    /// empty, every mint succeeds at the next block index from 100.
    #[derive(Default)]
    struct FakeMinter {
        replies: RefCell<VecDeque<Option<TransferResponse>>>,
        calls: RefCell<Vec<TransferArg>>,
    }

    impl FakeMinter {
        fn reply(self, reply: Option<TransferResponse>) -> Self {
            self.replies.borrow_mut().push_back(reply);
            self
        }

        fn calls(&self) -> Vec<TransferArg> {
            self.calls.borrow().clone()
        }
    }

    #[async_trait(?Send)]
    impl Minter for FakeMinter {
        async fn transfer(&self, args: TransferArg) -> Option<TransferResponse> {
            let n = self.calls.borrow().len() as u64;
            self.calls.borrow_mut().push(args);
            self.replies
                .borrow_mut()
                .pop_front()
                .unwrap_or(Some(Ok(Nat::from(100 + n))))
        }
    }

    fn mint(minter: &FakeMinter) {
        block_on(mint_queue(minter, minting_owner()));
    }

    fn settle(minter: &FakeMinter) {
        block_on(settle_unknown_mints(minter, minting_owner()));
    }

    /// One `bridge_process` round; `outbound` notes how many mint calls the minter had seen
    /// when the outbound half ran.
    fn round(minter: &FakeMinter, outbound: &RefCell<Option<usize>>) {
        block_on(process_round(Some(minter), minting_owner(), async {
            *outbound.borrow_mut() = Some(minter.calls().len());
        }));
    }

    fn memo_burn_id(args: &TransferArg) -> u64 {
        let memo = args.memo.as_ref().expect("memo").0.as_slice();
        u64::from_be_bytes(memo[15..23].try_into().unwrap())
    }

    fn candid(args: &TransferArg) -> Vec<u8> {
        Encode!(args).unwrap()
    }

    fn duplicate(index: u64) -> Option<TransferResponse> {
        Some(Err(TransferError::Duplicate {
            duplicate_of: Nat::from(index),
        }))
    }

    #[test]
    fn memo_is_gldt_in_chain_id_and_burn_id() {
        let memo = in_memo(8453, 7);
        let mut want = b"GLDT-IN".to_vec();
        want.extend_from_slice(&8453u64.to_be_bytes());
        want.extend_from_slice(&7u64.to_be_bytes());
        assert_eq!(memo.0.as_slice(), want.as_slice());
        assert_eq!(want.len(), 23);
    }

    #[test]
    fn mints_queued_in_order_and_reduces_bridged_out() {
        // 4 GLDT left on Base and 6 GLDT burned back to ICP: 10 GLDT were bridged out
        setup(10 * ONE, 4 * ONE);
        save(vec![
            burn(0, e8s(ONE), user()),
            burn(1, e8s(2 * ONE), user()),
            burn(2, e8s(3 * ONE), user()),
        ]);
        assert_eq!(bridge().unminted_e8s, e8s(6 * ONE));

        let minter = FakeMinter::default();
        mint(&minter);

        let calls = minter.calls();
        assert_eq!(
            calls.iter().map(memo_burn_id).collect::<Vec<_>>(),
            vec![0, 1, 2]
        );
        for (call, amount) in calls.iter().zip([ONE, 2 * ONE, 3 * ONE]) {
            assert_eq!(call.amount, Nat::from(amount));
            assert_eq!(call.to, user());
            assert_eq!(call.from_subaccount, None);
            assert_eq!(call.fee, None);
            assert!(call.created_at_time.is_some());
            assert_eq!(call.memo.as_ref().unwrap().0.len(), 23);
            assert_eq!(&call.memo.as_ref().unwrap().0[..7], b"GLDT-IN");
        }
        for (id, index) in [(0, 100), (1, 101), (2, 102)] {
            assert_eq!(
                status(id),
                InboundStatus::Minted {
                    icp_block_index: index
                }
            );
            assert_eq!(
                record(id).created_at_time,
                calls[id as usize].created_at_time
            );
        }
        let state = bridge();
        assert_eq!(state.bridged_out, 4 * ONE);
        assert_eq!(state.unminted_e8s, U256::ZERO);
        assert!(queued_ids().is_empty());
        assert!(state.inbound_held.is_empty());
        assert!(state.alerts.is_empty());
        assert_eq!(decision(), MintDecision::Empty);
    }

    #[test]
    fn guard_holds_when_supply_plus_unminted_exceeds_bridged_out() {
        // 5 GLDT on Base and 6 burned: 11 against 10 bridged out
        setup(10 * ONE, 5 * ONE);
        save(vec![burn(0, e8s(6 * ONE), user())]);
        let state = bridge();
        assert!(guard_holds(&state, state.unminted_e8s));
        assert_eq!(evm_side(&state, state.unminted_e8s), e8s(11 * ONE));
        assert_eq!(decision(), MintDecision::HoldGuard);

        let minter = FakeMinter::default();
        for _ in 0..3 {
            mint(&minter);
        }
        assert!(minter.calls().is_empty());
        assert_eq!(status(0), InboundStatus::Queued);
        assert_eq!(queued_ids(), vec![0]);
        let alerts = alerts_with("supply guard");
        assert_eq!(alerts.len(), 1, "{alerts:?}");
        assert_eq!(alerts[0].0, Severity::Warning);
        assert_eq!(bridge().alerts.len(), 1);
        assert_eq!(bridge().bridged_out, 10 * ONE);
        assert_eq!(bridge().unminted_e8s, e8s(6 * ONE));
    }

    #[test]
    fn guard_resumes_by_itself_when_numbers_line_up() {
        setup(10 * ONE, 5 * ONE);
        save(vec![burn(0, e8s(6 * ONE), user())]);
        let minter = FakeMinter::default();
        mint(&minter);
        assert!(minter.calls().is_empty());

        // a later reading shows 4 GLDT: a LayerZero transfer had counted on both chains
        mutate_state(|s| {
            s.data.bridge.chain_state_mut(CHAIN).unwrap().supply = Some(SupplyReading {
                block: 200,
                total_supply: e8s(4 * ONE),
            })
        });
        mint(&minter);
        assert_eq!(minter.calls().len(), 1);
        assert_eq!(
            status(0),
            InboundStatus::Minted {
                icp_block_index: 100
            }
        );
        assert_eq!(bridge().bridged_out, 4 * ONE);
        assert_eq!(bridge().mint_hold, None);
        assert_eq!(alerts_with("supply guard").len(), 1);

        // a new hold alerts again
        save(vec![burn(1, e8s(ONE), user())]);
        mint(&minter);
        assert_eq!(minter.calls().len(), 1);
        assert_eq!(alerts_with("supply guard").len(), 2);
    }

    #[test]
    fn guard_holds_with_huge_supply() {
        setup(10 * ONE, 0);
        mutate_state(|s| {
            for chain in [EvmChain::Ethereum, EvmChain::Base] {
                s.data.bridge.chain_state_mut(chain).unwrap().supply = Some(SupplyReading {
                    block: 1,
                    total_supply: U256::MAX,
                });
            }
        });
        save(vec![burn(0, U256::from(1u8), user())]);
        let state = bridge();
        // no wrap around to a small sum, and no panic
        assert_eq!(evm_side(&state, state.unminted_e8s), U256::MAX);
        assert!(guard_holds(&state, state.unminted_e8s));
        assert_eq!(decision(), MintDecision::HoldGuard);
        let minter = FakeMinter::default();
        mint(&minter);
        assert!(minter.calls().is_empty());
        assert_eq!(status(0), InboundStatus::Queued);
    }

    #[test]
    fn unminted_total_saturates_at_max() {
        setup(10 * ONE, 0);
        // a small burn first, then two forged burns of the largest uint256
        save(vec![
            burn(0, U256::from(1u8), user()),
            burn(1, U256::MAX, user()),
            burn(2, U256::MAX, user()),
        ]);
        let state = bridge();
        assert_eq!(state.unminted_e8s, U256::MAX);
        assert!(guard_holds(&state, state.unminted_e8s));
        // the small burn passes rule 1, and the saturated total holds it
        assert_eq!(decision(), MintDecision::HoldGuard);
        let minter = FakeMinter::default();
        mint(&minter);
        assert!(minter.calls().is_empty());
        assert_eq!(queued_ids(), vec![0, 1, 2]);
    }

    #[test]
    fn saturated_unminted_is_recounted_on_release() {
        setup(10 * ONE, 0);
        save(vec![
            burn(0, U256::MAX, user()),
            burn(1, U256::MAX, user()),
            burn(2, e8s(ONE), user()),
        ]);
        assert_eq!(bridge().unminted_e8s, U256::MAX);

        // one forged burn leaves the count (as an SNS reject will): the other one still
        // saturates the total, so the guard keeps holding the small burn
        let (k, mut forged) = (key(0), record(0));
        forged.status = InboundStatus::Rejected("forged".to_string());
        mutate_state(|s| {
            store_inbound(&mut s.data.bridge, k, &forged);
            release_unminted(&mut s.data.bridge, U256::MAX);
        });
        assert_eq!(bridge().unminted_e8s, U256::MAX);
        assert_eq!(queued_ids(), vec![1, 2]);

        let (k, mut forged) = (key(1), record(1));
        forged.status = InboundStatus::Rejected("forged".to_string());
        mutate_state(|s| {
            store_inbound(&mut s.data.bridge, k, &forged);
            release_unminted(&mut s.data.bridge, U256::MAX);
        });
        assert_eq!(bridge().unminted_e8s, e8s(ONE));
        assert_eq!(count_unminted(), e8s(ONE));
    }

    #[test]
    fn rule1_holds_independently_of_readings() {
        // no supply reading on either chain, and 5 GLDT bridged out
        setup(5 * ONE, 0);
        mutate_state(|s| {
            for chain in [EvmChain::Ethereum, EvmChain::Base] {
                s.data.bridge.chain_state_mut(chain).unwrap().supply = None;
            }
        });
        save(vec![burn(0, e8s(6 * ONE), user())]);
        assert_eq!(decision(), MintDecision::HoldRule1);
        // even with guard inputs that would pass, rule 1 holds the mint
        mutate_state(|s| s.data.bridge.unminted_e8s = U256::ZERO);
        assert!(!guard_holds(&bridge(), U256::ZERO));
        assert_eq!(decision(), MintDecision::HoldRule1);

        let minter = FakeMinter::default();
        mint(&minter);
        mint(&minter);
        assert!(minter.calls().is_empty());
        assert_eq!(status(0), InboundStatus::Queued);
        let alerts = alerts_with("rule 1");
        assert_eq!(alerts.len(), 1, "{alerts:?}");
        assert_eq!(alerts[0].0, Severity::Critical);
    }

    #[test]
    fn paused_in_stops_new_mints_but_unknowns_still_settle() {
        setup(10 * ONE, 5 * ONE);
        save(vec![
            burn(0, e8s(2 * ONE), user()),
            burn(1, e8s(3 * ONE), user()),
        ]);

        // the first mint gets no answer: it is MintUnknown and the run stops
        let minter = FakeMinter::default().reply(None);
        mint(&minter);
        assert_eq!(minter.calls().len(), 1);
        assert_eq!(status(0), InboundStatus::MintUnknown);
        assert_eq!(status(1), InboundStatus::Queued);

        mutate_state(|s| s.data.bridge.paused_in = true);
        let minter2 = FakeMinter::default().reply(duplicate(42));
        settle(&minter2);
        assert_eq!(minter2.calls().len(), 1);
        assert_eq!(candid(&minter2.calls()[0]), candid(&minter.calls()[0]));
        assert_eq!(
            status(0),
            InboundStatus::Minted {
                icp_block_index: 42
            }
        );
        assert_eq!(bridge().bridged_out, 8 * ONE);

        // paused: nothing new goes out
        assert_eq!(decision(), MintDecision::Paused);
        mint(&minter2);
        assert_eq!(minter2.calls().len(), 1);
        assert_eq!(status(1), InboundStatus::Queued);
        assert_eq!(queued_ids(), vec![1]);

        mutate_state(|s| s.data.bridge.paused_in = false);
        mint(&minter2);
        assert_eq!(
            status(1),
            InboundStatus::Minted {
                icp_block_index: 101
            }
        );
    }

    #[test]
    fn unsettled_mint_unknown_holds_new_mints_but_outbound_runs() {
        setup(10 * ONE, 5 * ONE);
        save(vec![
            burn(0, e8s(2 * ONE), user()),
            burn(1, e8s(3 * ONE), user()),
        ]);
        // the first mint gets no answer, and neither does its first retry
        let minter = FakeMinter::default().reply(None).reply(None);
        mint(&minter);
        assert_eq!(status(0), InboundStatus::MintUnknown);
        assert_eq!(decision(), MintDecision::HoldUnknown);

        // the retry is still unknown: the outbound half runs, burn 1 waits
        let outbound = RefCell::new(None);
        round(&minter, &outbound);
        assert_eq!(*outbound.borrow(), Some(2));
        assert_eq!(
            minter.calls().iter().map(memo_burn_id).collect::<Vec<_>>(),
            vec![0, 0]
        );
        assert_eq!(status(0), InboundStatus::MintUnknown);
        assert_eq!(status(1), InboundStatus::Queued);
        assert_eq!(decision(), MintDecision::HoldUnknown);
        // no alert for it, and the hold kind is untouched
        assert!(bridge().alerts.is_empty());
        assert_eq!(bridge().mint_hold, None);

        // without a ledger, a round runs the outbound half only
        let outbound_only = RefCell::new(false);
        block_on(process_round(None::<&FakeMinter>, minting_owner(), async {
            *outbound_only.borrow_mut() = true;
        }));
        assert!(*outbound_only.borrow());
        assert_eq!(minter.calls().len(), 2);

        // the next round settles it first, then mints burn 1
        let outbound = RefCell::new(None);
        round(&minter, &outbound);
        assert_eq!(*outbound.borrow(), Some(3));
        assert_eq!(
            minter.calls().iter().map(memo_burn_id).collect::<Vec<_>>(),
            vec![0, 0, 0, 1]
        );
        assert_eq!(
            status(0),
            InboundStatus::Minted {
                icp_block_index: 102
            }
        );
        assert_eq!(
            status(1),
            InboundStatus::Minted {
                icp_block_index: 103
            }
        );
        assert_eq!(bridge().bridged_out, 5 * ONE);
        assert_eq!(decision(), MintDecision::Empty);
        assert!(bridge().alerts.is_empty());
    }

    #[test]
    fn needs_manual_check_does_not_hold_new_mints() {
        setup(10 * ONE, 6 * ONE);
        save(vec![
            burn(0, e8s(3 * ONE), user()),
            burn(1, e8s(ONE), user()),
        ]);
        let minter = FakeMinter::default()
            .reply(None)
            .reply(Some(Err(TransferError::TooOld)));
        mint(&minter);
        assert_eq!(decision(), MintDecision::HoldUnknown);

        // one round: the retry is TooOld, burn 0 needs a manual check, and burn 1 goes out
        let outbound = RefCell::new(None);
        round(&minter, &outbound);
        assert!(matches!(status(0), InboundStatus::NeedsManualCheck(_)));
        assert_eq!(*outbound.borrow(), Some(2));
        assert_eq!(
            status(1),
            InboundStatus::Minted {
                icp_block_index: 102
            }
        );
        assert_eq!(decision(), MintDecision::Empty);
        let state = bridge();
        assert_eq!(state.bridged_out, 9 * ONE);
        assert_eq!(state.unminted_e8s, e8s(3 * ONE));
        assert_eq!(alerts_with("needs a manual check").len(), 1);
    }

    #[test]
    fn no_answer_then_duplicate_settles_once() {
        setup(10 * ONE, 7 * ONE);
        save(vec![burn(0, e8s(3 * ONE), user())]);
        let minter = FakeMinter::default().reply(None);
        mint(&minter);
        assert_eq!(status(0), InboundStatus::MintUnknown);
        assert_eq!(decision(), MintDecision::HoldUnknown);
        let stored = record(0);
        assert_eq!(stored.created_at_time, minter.calls()[0].created_at_time);
        assert_eq!(bridge().bridged_out, 10 * ONE);
        assert_eq!(bridge().unminted_e8s, e8s(3 * ONE));
        assert_eq!(queued_ids(), vec![0]);

        // a retry that proves nothing keeps it unknown, with the same arguments
        let retries = FakeMinter::default()
            .reply(Some(Err(TransferError::TemporarilyUnavailable)))
            .reply(Some(Err(TransferError::GenericError {
                error_code: Nat::from(1u8),
                message: "busy".to_string(),
            })))
            .reply(duplicate(9));
        settle(&retries);
        settle(&retries);
        assert_eq!(status(0), InboundStatus::MintUnknown);
        settle(&retries);
        assert_eq!(status(0), InboundStatus::Minted { icp_block_index: 9 });
        for call in retries.calls() {
            assert_eq!(candid(&call), candid(&minter.calls()[0]));
        }
        assert_eq!(bridge().bridged_out, 7 * ONE);
        assert_eq!(bridge().unminted_e8s, U256::ZERO);
        assert!(queued_ids().is_empty());

        // late or repeated answers change nothing
        let before = bridge();
        let k = key(0);
        for result in [
            MintResult::Ok(10),
            MintResult::Duplicate(9),
            MintResult::NoAnswer,
            MintResult::TooOld,
            MintResult::Refused(TransferError::TooOld),
        ] {
            let applied = mutate_state(|s| apply_mint_result(&mut s.data.bridge, k, result, 5));
            assert_eq!(applied, None);
        }
        assert_eq!(bridge(), before);
        assert_eq!(status(0), InboundStatus::Minted { icp_block_index: 9 });

        // a settled record is no longer retried
        let none = FakeMinter::default();
        settle(&none);
        assert!(none.calls().is_empty());
    }

    #[test]
    fn too_old_while_unknown_becomes_needs_manual_check_and_stays_unminted() {
        setup(10 * ONE, 6 * ONE);
        save(vec![
            burn(0, e8s(3 * ONE), user()),
            burn(1, e8s(ONE), user()),
        ]);
        let minter = FakeMinter::default().reply(None);
        mint(&minter);
        assert_eq!(status(0), InboundStatus::MintUnknown);

        let retry = FakeMinter::default().reply(Some(Err(TransferError::TooOld)));
        settle(&retry);
        let InboundStatus::NeedsManualCheck(reason) = status(0) else {
            panic!("{:?}", status(0));
        };
        assert!(reason.contains("GLDT-IN"), "{reason}");
        let state = bridge();
        assert_eq!(state.bridged_out, 10 * ONE);
        assert_eq!(state.unminted_e8s, e8s(4 * ONE));
        assert!(state.inbound_held.contains(&key(0)));
        assert_eq!(queued_ids(), vec![1]);
        let alerts = alerts_with("needs a manual check");
        assert_eq!(alerts.len(), 1, "{:?}", state.alerts);
        assert_eq!(alerts[0].0, Severity::Critical);

        // the guard still counts it: 6 on Base + 3 held + 1 queued = 10, so the next mint goes
        mint(&retry);
        assert_eq!(
            status(1),
            InboundStatus::Minted {
                icp_block_index: 101
            }
        );
        assert_eq!(bridge().unminted_e8s, e8s(3 * ONE));
        assert_eq!(bridge().bridged_out, 9 * ONE);
    }

    #[test]
    fn mint_to_minting_account_is_quarantined_and_counted() {
        setup(20 * ONE, 0);
        let minting = Account::from(minting_owner());
        let minting_zero_subaccount = Account {
            owner: minting_owner(),
            subaccount: Some([0; 32]),
        };
        let other = Account::from(Principal::from_slice(&[8; 29]));
        save(vec![
            burn(0, e8s(ONE), minting),
            burn(1, e8s(2 * ONE), minting_zero_subaccount),
            burn(2, e8s(3 * ONE), user()),
            burn(3, e8s(4 * ONE), other),
        ]);
        // the ledger refuses burn 3 on its first call
        let minter = FakeMinter::default()
            .reply(Some(Ok(Nat::from(100u8))))
            .reply(Some(Err(TransferError::GenericError {
                error_code: Nat::from(0u8),
                message: "refused".to_string(),
            })));
        mint(&minter);

        // no ledger call for the minting account
        assert_eq!(
            minter.calls().iter().map(memo_burn_id).collect::<Vec<_>>(),
            vec![2, 3]
        );
        for id in [0, 1, 3] {
            assert!(
                matches!(status(id), InboundStatus::Quarantined(_)),
                "{id}: {:?}",
                status(id)
            );
        }
        assert_eq!(
            status(2),
            InboundStatus::Minted {
                icp_block_index: 100
            }
        );
        let state = bridge();
        // still unminted: 1 + 2 + 4
        assert_eq!(state.unminted_e8s, e8s(7 * ONE));
        assert_eq!(state.bridged_out, 17 * ONE);
        assert_eq!(
            state.inbound_held.iter().map(|k| k.1).collect::<Vec<_>>(),
            vec![0, 1, 3]
        );
        assert!(queued_ids().is_empty());
        assert_eq!(alerts_with("quarantined").len(), 3);
    }

    #[test]
    fn mint_to_anonymous_principal_is_quarantined_and_counted() {
        setup(10 * ONE, 0);
        save(vec![
            burn(0, e8s(ONE), Account::from(Principal::anonymous())),
            burn(1, e8s(2 * ONE), user()),
        ]);
        let minter = FakeMinter::default();
        mint(&minter);
        assert_eq!(
            minter.calls().iter().map(memo_burn_id).collect::<Vec<_>>(),
            vec![1]
        );
        let InboundStatus::Quarantined(reason) = status(0) else {
            panic!("{:?}", status(0));
        };
        assert!(reason.contains("anonymous"), "{reason}");
        assert_eq!(
            status(1),
            InboundStatus::Minted {
                icp_block_index: 100
            }
        );
        let state = bridge();
        assert_eq!(state.unminted_e8s, e8s(ONE));
        assert_eq!(state.bridged_out, 8 * ONE);
        assert!(state.inbound_held.contains(&key(0)));
    }

    #[test]
    fn classify_mint_trusts_only_answers_that_prove_the_outcome() {
        use TransferError as E;
        let refusals = [
            E::BadFee {
                expected_fee: Nat::from(0u8),
            },
            E::BadBurn {
                min_burn_amount: Nat::from(1u8),
            },
            E::InsufficientFunds {
                balance: Nat::from(0u8),
            },
            E::CreatedInFuture { ledger_time: 1 },
            E::GenericError {
                error_code: Nat::from(0u8),
                message: "no".to_string(),
            },
        ];
        for retry in [false, true] {
            assert_eq!(classify_mint(None, retry), MintResult::NoAnswer);
            assert_eq!(
                classify_mint(Some(Ok(Nat::from(5u8))), retry),
                MintResult::Ok(5)
            );
            assert_eq!(classify_mint(duplicate(6), retry), MintResult::Duplicate(6));
            assert_eq!(
                classify_mint(Some(Err(E::TemporarilyUnavailable)), retry),
                MintResult::NoAnswer
            );
            // a block index above u64 proves nothing we can store
            assert_eq!(
                classify_mint(Some(Ok(Nat::from(u128::MAX))), retry),
                MintResult::NoAnswer
            );
        }
        // the first call: a refusal is final
        for e in refusals.clone() {
            assert_eq!(
                classify_mint(Some(Err(e.clone())), false),
                MintResult::Refused(e)
            );
        }
        assert_eq!(
            classify_mint(Some(Err(E::TooOld)), false),
            MintResult::Refused(E::TooOld)
        );
        // a retry: only TooOld settles, every other refusal proves nothing
        assert_eq!(
            classify_mint(Some(Err(E::TooOld)), true),
            MintResult::TooOld
        );
        for e in refusals {
            assert_eq!(classify_mint(Some(Err(e)), true), MintResult::NoAnswer);
        }
    }

    #[test]
    fn inbound_queries_find_by_burn_id_tx_and_account() {
        setup(10 * ONE, 0);
        let other = Account::from(Principal::from_slice(&[8; 29]));
        let mut same_tx = burn(1, e8s(ONE), other);
        same_tx.tx_hash = tx_hash(0);
        save(vec![
            burn(0, e8s(ONE), user()),
            same_tx,
            burn(2, e8s(ONE), user()),
        ]);

        read_state(|s| {
            let bridge = &s.data.bridge;
            let found = transfer_in(bridge, CHAIN, 1).unwrap();
            assert_eq!(found.burn_id, 1);
            assert_eq!(found.to, other);
            assert_eq!(found.amount, Nat::from(ONE));
            assert_eq!(found.status, InboundStatus::Queued);
            assert_eq!(transfer_in(bridge, CHAIN, 9), None);
            assert_eq!(transfer_in(bridge, EvmChain::Ethereum, 0), None);

            let by_tx = transfers_in_by_tx(
                bridge,
                CHAIN,
                &tx_hash(0).to_uppercase().replace("0X", "0x"),
            );
            assert_eq!(
                by_tx.iter().map(|t| t.burn_id).collect::<Vec<_>>(),
                vec![0, 1]
            );
            assert!(transfers_in_by_tx(bridge, EvmChain::Ethereum, &tx_hash(0)).is_empty());
        });

        let ids = |start, limit| {
            transfers_in_by_account(&user(), start, limit)
                .iter()
                .map(|t| t.burn_id)
                .collect::<Vec<_>>()
        };
        // newest first; `start` skips that many
        assert_eq!(ids(None, 10), vec![2, 0]);
        assert_eq!(ids(None, 1), vec![2]);
        assert_eq!(ids(Some(1), 10), vec![0]);
        assert_eq!(ids(Some(2), 10), Vec::<u64>::new());
        assert_eq!(ids(None, 0), Vec::<u64>::new());
        let zero_subaccount = Account {
            owner: user().owner,
            subaccount: Some([0; 32]),
        };
        assert_eq!(transfers_in_by_account(&zero_subaccount, None, 10).len(), 2);
    }
}
