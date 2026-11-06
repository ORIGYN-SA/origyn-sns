use crate::bridge::evm::address::format_address;
use crate::bridge::evm::num::u256_to_nat;
use crate::bridge::stable::{with_inbound, with_queue};
use crate::bridge::state::{BridgeState, ChainState};
use crate::state::read_state;
use alloy_primitives::U256;
use candid::Nat;
pub use gldt_swap_api_canister::get_bridge_status::Response as GetBridgeStatusResponse;
use gldt_swap_common::bridge::{
    ChainConfig, ChainStatus, InboundStatus, QueueSizes, SupplyGuardStatus, SupplyReadingStatus,
    WindowStatus,
};
use ic_cdk::query;

#[query]
pub fn get_bridge_status() -> GetBridgeStatusResponse {
    let queue = queue_sizes();
    read_state(|s| {
        let bridge = &s.data.bridge;
        GetBridgeStatusResponse {
            configured: bridge.config.is_some(),
            bridged_out: Nat::from(bridge.bridged_out),
            out_pending: Nat::from(bridge.out_pending),
            paused_in: bridge.paused_in,
            paused_out: bridge.paused_out,
            chains: chain_statuses(bridge),
            supply_guard: supply_guard(bridge, U256::ZERO),
            queue,
            claims_signer: bridge
                .claims_signer
                .as_ref()
                .map(|signer| format_address(&signer.address)),
            admin_signer: bridge
                .admin_signer
                .as_ref()
                .map(|signer| format_address(&signer.address)),
            alerts: bridge.alerts.iter().cloned().collect(),
            alerts_total: bridge.alerts_total,
        }
    })
}

/// The current deployment of every configured chain.
fn current_chains(bridge: &BridgeState) -> Vec<(&ChainConfig, Option<&ChainState>)> {
    bridge
        .config
        .iter()
        .flat_map(|cfg| cfg.chains.iter())
        .map(|cfg| (cfg, bridge.chain_state(cfg.chain)))
        .collect()
}

fn chain_statuses(bridge: &BridgeState) -> Vec<ChainStatus> {
    current_chains(bridge)
        .into_iter()
        .map(|(cfg, state)| {
            let default = ChainState::default();
            let state = state.unwrap_or(&default);
            ChainStatus {
                chain: cfg.chain,
                chain_id: cfg.chain_id,
                token: cfg.token.clone(),
                start_block: state.start_block,
                last_scraped_block: state.last_scraped_block,
                next_burn_id: state.next_burn_id,
                window: state.window.as_ref().map(|w| WindowStatus {
                    to_block: w.to_block,
                    end_burn_id: w.end_burn_id,
                    total_supply: u256_to_nat(w.total_supply),
                }),
                supply: state.supply.as_ref().map(|r| SupplyReadingStatus {
                    block: r.block,
                    total_supply: u256_to_nat(r.total_supply),
                }),
                failed_ticks: state.failed_ticks,
                last_ok_at: state.last_ok_at,
                last_error: state.last_error.clone(),
                stopped: state.stopped.clone(),
            }
        })
        .collect()
}

/// Both sides of the supply guard: the chains' supply readings plus `unminted`,
/// against `bridged_out`. The sum saturates, and a saturated sum holds.
fn supply_guard(bridge: &BridgeState, unminted: U256) -> SupplyGuardStatus {
    let supply = current_chains(bridge)
        .into_iter()
        .filter_map(|(_, state)| state?.supply.as_ref())
        .fold(U256::ZERO, |sum, reading| {
            sum.saturating_add(reading.total_supply)
        });
    let evm_side = supply.saturating_add(unminted);
    let icp_side = U256::from(bridge.bridged_out);
    SupplyGuardStatus {
        holding: evm_side > icp_side,
        evm_side: u256_to_nat(evm_side),
        icp_side: Nat::from(bridge.bridged_out),
    }
}

/// Inbound records waiting in the mint queue, by status.
fn queue_sizes() -> QueueSizes {
    let keys: Vec<_> = with_queue(|queue| queue.iter().map(|entry| entry.value()).collect());
    with_inbound(|inbound| {
        let mut sizes = QueueSizes::default();
        for key in keys {
            match inbound.get(&key).map(|record| record.status) {
                Some(InboundStatus::Queued) => sizes.queued += 1,
                Some(InboundStatus::MintUnknown) => sizes.mint_unknown += 1,
                Some(InboundStatus::Quarantined(_)) => sizes.quarantined += 1,
                Some(InboundStatus::NeedsManualCheck(_)) => sizes.needs_manual_check += 1,
                _ => {}
            }
        }
        sizes
    })
}
