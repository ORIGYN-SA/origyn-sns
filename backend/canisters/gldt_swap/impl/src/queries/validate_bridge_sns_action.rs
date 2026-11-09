use crate::bridge::sns::validate_action;
use crate::state::read_state;
pub use gldt_swap_api_canister::validate_bridge_sns_action::{
    Args as ValidateBridgeSnsActionArgs, Response as ValidateBridgeSnsActionResponse,
};
use ic_cdk::update;

/// The SNS validator of `bridge_sns_action`: the text voters read, or why the action
/// would fail. Open to every caller, so proposers can preview the text; it only reads state.
/// An update, not a query, so SNS governance can call it.
#[update]
pub fn validate_bridge_sns_action(
    action: ValidateBridgeSnsActionArgs,
) -> ValidateBridgeSnsActionResponse {
    read_state(|s| validate_action(&s.data.bridge, &action))
}
