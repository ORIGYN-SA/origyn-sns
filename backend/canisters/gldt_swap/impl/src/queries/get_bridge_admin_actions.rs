use crate::bridge::admin_actions::admin_actions;
pub use gldt_swap_api_canister::get_bridge_admin_actions::Response as GetBridgeAdminActionsResponse;
use ic_cdk::query;

/// Signed admin actions, newest first. `start` is an exclusive upper bound on the id (the last
/// id of the previous page); `limit` is capped at 100.
#[query]
pub fn get_bridge_admin_actions(start: Option<u64>, limit: u32) -> GetBridgeAdminActionsResponse {
    admin_actions(start, limit)
}
