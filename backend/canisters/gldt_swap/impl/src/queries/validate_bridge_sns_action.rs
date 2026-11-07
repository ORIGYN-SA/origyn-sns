use crate::bridge::sns::validate_action;
use crate::state::read_state;
pub use gldt_swap_api_canister::validate_bridge_sns_action::{
    Args as ValidateBridgeSnsActionArgs, Response as ValidateBridgeSnsActionResponse,
};
use ic_cdk::update;

/// The SNS validator of `bridge_sns_action` (spec 8.9): the text voters read, or why the action
/// would fail. Open to every caller, so proposers can preview the text; it only reads state.
/// An update, as in the spec's Candid, so SNS governance calls it as before.
#[update]
pub fn validate_bridge_sns_action(
    action: ValidateBridgeSnsActionArgs,
) -> ValidateBridgeSnsActionResponse {
    read_state(|s| validate_action(&s.data.bridge, &action))
}
