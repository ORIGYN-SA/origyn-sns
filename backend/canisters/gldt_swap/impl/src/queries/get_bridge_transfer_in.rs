use crate::bridge::inbound::transfer_in;
use crate::state::read_state;
pub use gldt_swap_api_canister::get_bridge_transfer_in::Response as GetBridgeTransferInResponse;
use ic_cdk::query;

/// The inbound transfer of burn `burn_id` on the chain's current token.
// full paths because `export_candid!` resolves argument types at the crate root
#[query]
pub fn get_bridge_transfer_in(
    chain: gldt_swap_common::bridge::EvmChain,
    burn_id: u64,
) -> GetBridgeTransferInResponse {
    read_state(|s| transfer_in(&s.data.bridge, chain, burn_id))
}
