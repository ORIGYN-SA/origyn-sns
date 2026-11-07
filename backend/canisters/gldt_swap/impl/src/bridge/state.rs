//! Bridge state kept in `Data` (heap, serialized on upgrade) and the records kept in the
//! stable maps (see `stable.rs`).
//!
//! Times are nanoseconds since the Unix epoch unless a field says otherwise.
//! EVM `uint256` values are `U256`; U256 math is saturating only, never `+`, `-` or `.sum()`,
//! because ruint wraps silently. ICP counters are `u128` and trap on overflow.

use crate::bridge::evm::address::{format_address, parse_address};
use crate::bridge::evm::num::u256_to_nat;
use alloy_primitives::U256;
pub use gldt_swap_common::bridge::{Alert, Severity};
use gldt_swap_common::bridge::{
    BridgeConfig, ChainConfig, EvmCall, EvmChain, InboundStatus, InboundTransfer,
    SignedEvmAdminAction,
};
use icrc_ledger_types::icrc1::account::Account;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use tracing::{error, info, warn};

/// `(chain_id, token)`. A new token address on a chain is a new deployment with its own state.
pub type Deployment = (u64, [u8; 20]);

/// `get_bridge_status` shows this many recent alerts.
pub const MAX_ALERTS: usize = 100;

/// One threshold ECDSA key of the canister.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct EvmSigner {
    /// SEC1 compressed, as `ecdsa_public_key` returns it.
    pub public_key: Vec<u8>,
    pub address: [u8; 20],
}

/// A window of blocks being scraped. It is finished before a new one starts.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Window {
    pub to_block: u64,
    /// The `nextBurnId` read at `to_block`: ids up to here belong to this window.
    pub end_burn_id: u64,
    pub total_supply: U256,
}

/// The chain's `totalSupply` at a block, saved with a window's last batch.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct SupplyReading {
    pub block: u64,
    pub total_supply: U256,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq, Eq)]
#[serde(default)]
pub struct ChainState {
    /// Set by the first tick; `None` means the chain is not open yet.
    pub start_block: Option<u64>,
    pub last_scraped_block: u64,
    /// The next burn id we expect.
    pub next_burn_id: u64,
    /// The window in progress, if any.
    pub window: Option<Window>,
    pub supply: Option<SupplyReading>,
    /// Failed ticks in a row.
    pub failed_ticks: u32,
    pub last_ok_at: Option<u64>,
    pub last_error: Option<String>,
    /// Why the chain stopped: the first tick failed, or a deep reorg. Only a `ChainReset` clears it.
    pub stopped: Option<String>,
    /// When `last_scraped_block` or `next_burn_id` last moved; `None` until the first move.
    pub cursor_moved_at: Option<u64>,
    /// A stale cursor alert was raised since the cursor last moved.
    pub stale_alerted: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq, Eq)]
#[serde(default)]
pub struct BridgeState {
    /// `None` until an init or upgrade argument configures the bridge.
    pub config: Option<BridgeConfig>,
    pub claims_signer: Option<EvmSigner>,
    pub admin_signer: Option<EvmSigner>,
    /// Confirmed outbound, e8s.
    pub bridged_out: u128,
    /// Outbound burns in progress, e8s.
    pub out_pending: u128,
    /// Stops new ICP to EVM transfers.
    pub paused_out: bool,
    /// Stops new EVM to ICP mints.
    pub paused_in: bool,
    pub next_out_id: u64,
    pub next_queue_seq: u64,
    /// Also the `execute` nonce.
    pub next_admin_action_id: u64,
    pub chains: BTreeMap<Deployment, ChainState>,
    /// The last `MAX_ALERTS` alerts, oldest first.
    pub alerts: VecDeque<Alert>,
    /// Every alert ever raised.
    pub alerts_total: u64,
    /// Outbound transfers the processor still has work on: `Burning`, `BurnUnknown` or
    /// `Burned`. Kept with every status change (`outbound::store_outbound`), so the processor
    /// never scans the whole outbound map.
    pub outbound_work: BTreeSet<u64>,
    /// Every inbound burn that is not `Minted` or `Rejected`, e8s: the unminted side of the
    /// supply guard. Saturating; a saturated total holds minting.
    pub unminted_e8s: U256,
    /// The check that last held the mint queue, so each hold alerts once.
    pub mint_hold: Option<MintHold>,
    /// Inbound transfers waiting for an SNS resolve: `Quarantined` or `NeedsManualCheck`.
    /// They have left the mint queue.
    pub inbound_held: BTreeSet<(Deployment, u64)>,
    /// Outbound transfers waiting for an SNS resolve: `NeedsManualCheck`. Kept by
    /// `outbound::store_outbound`, like `outbound_work`.
    pub outbound_held: BTreeSet<u64>,
    /// The balance was below `alerts::LOW_CYCLES` at the last check, so the low cycles alert
    /// fired already.
    pub cycles_low: bool,
}

/// Why the mint queue waits (spec 8.8).
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum MintHold {
    /// Supply readings plus unminted burns are above `bridged_out`.
    Guard,
    /// The next burn alone is above `bridged_out`.
    Rule1,
}

impl BridgeState {
    pub fn add_bridged_out(&mut self, e8s: u128) {
        self.bridged_out = self
            .bridged_out
            .checked_add(e8s)
            .unwrap_or_else(|| panic!("bridged_out overflow: {} + {e8s}", self.bridged_out));
    }

    pub fn sub_bridged_out(&mut self, e8s: u128) {
        self.bridged_out = self
            .bridged_out
            .checked_sub(e8s)
            .unwrap_or_else(|| panic!("bridged_out underflow: {} - {e8s}", self.bridged_out));
    }

    pub fn add_out_pending(&mut self, e8s: u128) {
        self.out_pending = self
            .out_pending
            .checked_add(e8s)
            .unwrap_or_else(|| panic!("out_pending overflow: {} + {e8s}", self.out_pending));
    }

    pub fn sub_out_pending(&mut self, e8s: u128) {
        self.out_pending = self
            .out_pending
            .checked_sub(e8s)
            .unwrap_or_else(|| panic!("out_pending underflow: {} - {e8s}", self.out_pending));
    }

    /// Records an alert, writes a log line and counts it. Never traps.
    pub fn push_alert(&mut self, now: u64, severity: Severity, msg: String) {
        match severity {
            Severity::Info => info!(alert = %msg, "bridge alert"),
            Severity::Warning => warn!(alert = %msg, "bridge alert"),
            Severity::Critical => error!(alert = %msg, "bridge alert"),
        }
        self.alerts.push_back(Alert {
            time: now,
            severity,
            message: msg,
        });
        while self.alerts.len() > MAX_ALERTS {
            self.alerts.pop_front();
        }
        self.alerts_total = self.alerts_total.saturating_add(1);
    }

    pub fn chain_config(&self, chain: EvmChain) -> Option<&ChainConfig> {
        self.config
            .as_ref()?
            .chains
            .iter()
            .find(|c| c.chain == chain)
    }

    /// The chain's current deployment, from the config.
    pub fn deployment(&self, chain: EvmChain) -> Option<Deployment> {
        let cfg = self.chain_config(chain)?;
        // validated when the config was applied
        let token = parse_address(&cfg.token).ok()?;
        Some((cfg.chain_id, token))
    }

    /// The state of the chain's current deployment.
    pub fn chain_state(&self, chain: EvmChain) -> Option<&ChainState> {
        self.chains.get(&self.deployment(chain)?)
    }

    pub fn chain_state_mut(&mut self, chain: EvmChain) -> Option<&mut ChainState> {
        let deployment = self.deployment(chain)?;
        self.chains.get_mut(&deployment)
    }
}

/// An inbound transfer as stored in map 2: the fields of Candid `InboundTransfer`,
/// with the full 256-bit amount.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct InboundRecord {
    pub chain: EvmChain,
    pub token: String,
    pub burn_id: u64,
    pub tx_hash: String,
    pub log_index: u64,
    pub block_number: u64,
    pub evm_from: String,
    pub to: Account,
    pub amount: U256,
    pub discovered_at: u64,
    pub status: InboundStatus,
    /// The mint's `created_at_time`, fixed before the first ledger call. Every retry sends
    /// it again, so the ledger answers `Duplicate` if an earlier call minted.
    #[serde(default)]
    pub created_at_time: Option<u64>,
}

impl InboundRecord {
    pub fn to_candid(&self) -> InboundTransfer {
        InboundTransfer {
            chain: self.chain,
            token: self.token.clone(),
            burn_id: self.burn_id,
            tx_hash: self.tx_hash.clone(),
            log_index: self.log_index,
            block_number: self.block_number,
            evm_from: self.evm_from.clone(),
            to: self.to,
            amount: u256_to_nat(self.amount),
            discovered_at: self.discovered_at,
            status: self.status.clone(),
        }
    }
}

/// A signed `execute` batch as stored in map 4.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct SignedAdminAction {
    /// Also the `execute` nonce.
    pub id: u64,
    pub chain: EvmChain,
    pub chain_id: u64,
    pub token: [u8; 20],
    /// `(target, data)` in order.
    pub calls: Vec<([u8; 20], Vec<u8>)>,
    /// Unix seconds.
    pub deadline: u64,
    pub digest: [u8; 32],
    /// `r || s || v`.
    #[serde(with = "serde_bytes")]
    pub signature: [u8; 65],
    /// The validator's text.
    pub description: String,
    pub created_at: u64,
}

impl SignedAdminAction {
    pub fn to_candid(&self) -> SignedEvmAdminAction {
        SignedEvmAdminAction {
            id: self.id,
            chain: self.chain,
            chain_id: self.chain_id,
            token: format_address(&self.token),
            calls: self
                .calls
                .iter()
                .map(|(target, data)| EvmCall {
                    target: format_address(target),
                    data: data.clone(),
                })
                .collect(),
            nonce: self.id,
            deadline: self.deadline,
            signature: format!("0x{}", alloy_primitives::hex::encode(self.signature)),
            description: self.description.clone(),
            created_at: self.created_at,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::evm::num::u256_to_nat;
    use icrc_ledger_types::icrc1::account::Account;

    #[test]
    #[should_panic(expected = "bridged_out underflow")]
    fn counters_trap_on_underflow() {
        let mut state = BridgeState::default();
        state.sub_bridged_out(1);
    }

    #[test]
    #[should_panic(expected = "out_pending underflow")]
    fn out_pending_traps_on_underflow() {
        let mut state = BridgeState::default();
        state.add_out_pending(5);
        state.sub_out_pending(6);
    }

    #[test]
    #[should_panic(expected = "bridged_out overflow")]
    fn bridged_out_traps_on_overflow() {
        let mut state = BridgeState::default();
        state.add_bridged_out(u128::MAX);
        state.add_bridged_out(1);
    }

    #[test]
    #[should_panic(expected = "out_pending overflow")]
    fn out_pending_traps_on_overflow() {
        let mut state = BridgeState::default();
        state.add_out_pending(u128::MAX);
        state.add_out_pending(1);
    }

    #[test]
    fn counters_add_and_sub() {
        let mut state = BridgeState::default();
        state.add_bridged_out(500);
        state.sub_bridged_out(200);
        state.add_out_pending(70);
        state.sub_out_pending(70);
        assert_eq!(state.bridged_out, 300);
        assert_eq!(state.out_pending, 0);
    }

    #[test]
    fn alerts_keep_the_last_100() {
        let mut state = BridgeState::default();
        for i in 0..105u64 {
            state.push_alert(i, Severity::Warning, format!("alert {i}"));
        }
        assert_eq!(state.alerts.len(), MAX_ALERTS);
        assert_eq!(state.alerts.front().unwrap().message, "alert 5");
        assert_eq!(state.alerts.back().unwrap().message, "alert 104");
        assert_eq!(state.alerts.back().unwrap().time, 104);
        assert_eq!(state.alerts_total, 105);
    }

    #[test]
    fn inbound_record_to_candid_keeps_every_field() {
        let record = InboundRecord {
            chain: EvmChain::Base,
            token: "0x00000000000000000000000000000000000B1D6E".to_string(),
            burn_id: 9,
            tx_hash: format!("0x{}", "ab".repeat(32)),
            log_index: 3,
            block_number: 77,
            evm_from: "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string(),
            to: Account {
                owner: candid::Principal::from_slice(&[4; 29]),
                subaccount: Some([1; 32]),
            },
            amount: U256::MAX,
            discovered_at: 1_000,
            status: InboundStatus::Minted {
                icp_block_index: 12,
            },
            created_at_time: Some(1_100),
        };
        let candid = record.to_candid();
        assert_eq!(candid.chain, record.chain);
        assert_eq!(candid.token, record.token);
        assert_eq!(candid.burn_id, 9);
        assert_eq!(candid.tx_hash, record.tx_hash);
        assert_eq!(candid.log_index, 3);
        assert_eq!(candid.block_number, 77);
        assert_eq!(candid.evm_from, record.evm_from);
        assert_eq!(candid.to, record.to);
        assert_eq!(candid.amount, u256_to_nat(U256::MAX));
        assert_eq!(candid.discovered_at, 1_000);
        assert_eq!(candid.status, record.status);
    }

    #[test]
    fn signed_admin_action_to_candid_formats_hex() {
        let action = SignedAdminAction {
            id: 4,
            chain: EvmChain::Ethereum,
            chain_id: 1,
            token: [0x11; 20],
            calls: vec![([0x22; 20], vec![0xde, 0xad])],
            deadline: 1_900_000_000,
            digest: [0x33; 32],
            signature: [0x44; 65],
            description: "text".to_string(),
            created_at: 5,
        };
        let candid = action.to_candid();
        assert_eq!(candid.id, 4);
        assert_eq!(candid.nonce, 4);
        assert_eq!(candid.chain_id, 1);
        assert_eq!(
            candid.token.to_lowercase(),
            format!("0x{}", "11".repeat(20))
        );
        assert_eq!(candid.calls.len(), 1);
        assert_eq!(
            candid.calls[0].target.to_lowercase(),
            format!("0x{}", "22".repeat(20))
        );
        assert_eq!(candid.calls[0].data, vec![0xde, 0xad]);
        assert_eq!(candid.signature, format!("0x{}", "44".repeat(65)));
        assert_eq!(candid.deadline, 1_900_000_000);
        assert_eq!(candid.description, "text");
        assert_eq!(candid.created_at, 5);
    }
}
