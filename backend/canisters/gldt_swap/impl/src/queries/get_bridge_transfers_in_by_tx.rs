use crate::bridge::inbound::transfers_in_by_tx;
use crate::state::read_state;
pub use gldt_swap_api_canister::get_bridge_transfers_in_by_tx::Response as GetBridgeTransfersInByTxResponse;
use ic_cdk::query;

/// The saved burns of an EVM transaction, in burn id order. Lookup only: it never fetches.
// full paths because `export_candid!` resolves argument types at the crate root
#[query]
pub fn get_bridge_transfers_in_by_tx(
    chain: gldt_swap_common::bridge::EvmChain,
    tx_hash: String,
) -> GetBridgeTransfersInByTxResponse {
    read_state(|s| transfers_in_by_tx(&s.data.bridge, chain, &tx_hash))
}
