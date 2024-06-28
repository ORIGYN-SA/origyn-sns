use ic_cdk_macros::query;
pub use management_api_canister::get_ogy_dashboard_maintenance_mode::Response as GetGLDDashboardMaintenanceModeResponse;
use crate::state::read_state;

#[query]
pub fn get_gld_dashboard_maintenance_mode() -> GetGLDDashboardMaintenanceModeResponse {
    read_state(|s| s.data.ogy_dashboard_maintenance_mode)
}
