use crate::bridge::outbound::bridge_to_evm_impl;
use crate::guards::reject_anonymous_caller;
pub use gldt_swap_api_canister::bridge_to_evm::{
    Args as BridgeToEvmArgs, Response as BridgeToEvmResponse,
};
use ic_cdk::update;

/// Burns the caller's GLDT on ICP and signs a claim voucher for Ethereum or Base.
/// The caller first approves `gldt_swap` for `amount` on the GLDT ledger.
#[update(guard = "reject_anonymous_caller")]
pub async fn bridge_to_evm(args: BridgeToEvmArgs) -> BridgeToEvmResponse {
    bridge_to_evm_impl(args).await
}
