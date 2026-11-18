use crate::bridge::outbound::transfer_out;
pub use gldt_swap_api_canister::get_bridge_transfer_out::{
    Args as GetBridgeTransferOutArgs, Response as GetBridgeTransferOutResponse,
};
use ic_cdk::query;

/// One outbound transfer. The frontend polls it until the status is `Signed`, then submits the
/// voucher with `claimFromIcp`. Vouchers never expire.
#[query]
pub fn get_bridge_transfer_out(id: GetBridgeTransferOutArgs) -> GetBridgeTransferOutResponse {
    transfer_out(id)
}
