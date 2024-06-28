use ic_cdk::update;
pub use management_api_canister::update_ogy_dashboard_maintenance_mode::{
    Args as UpdateGLDDashboardMaintenanceModeArgs,
    Response as UpdateGLDDashboardMaintenanceModeResponse,
};
use crate::guards::caller_is_authorized;

use crate::state::mutate_state;

#[update(guard = "caller_is_authorized")]
async fn update_gld_dashboard_maintenance_mode(
    value: UpdateGLDDashboardMaintenanceModeArgs
) -> UpdateGLDDashboardMaintenanceModeResponse {
    mutate_state(|s| {
        s.data.ogy_dashboard_maintenance_mode = value;
    })
}
