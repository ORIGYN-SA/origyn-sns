use crate::bridge::sns::run_action;
use crate::guards::caller_is_sns_governance;
pub use gldt_swap_api_canister::bridge_sns_action::Args as BridgeSnsActionArgs;
use ic_cdk::update;

/// The bridge's SNS generic function, for ORIGYN SNS governance only. The action is
/// checked again on the current state, and any error traps, so the proposal shows as failed.
#[update(guard = "caller_is_sns_governance")]
pub async fn bridge_sns_action(action: BridgeSnsActionArgs) {
    if let Err(e) = run_action(action).await {
        ic_cdk::trap(format!("bridge_sns_action failed: {e}"));
    }
}
