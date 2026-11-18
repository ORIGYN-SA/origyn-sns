use crate::bridge::admin_actions::admin_action;
pub use gldt_swap_api_canister::get_bridge_admin_action::{
    Args as GetBridgeAdminActionArgs, Response as GetBridgeAdminActionResponse,
};
use ic_cdk::query;

/// One signed admin action: anyone may submit it with `execute` on the token before its
/// deadline.
#[query]
pub fn get_bridge_admin_action(id: GetBridgeAdminActionArgs) -> GetBridgeAdminActionResponse {
    admin_action(id)
}
