use crate::guards::caller_is_governance_principal;
use crate::state::{mutate_state, RuntimeState};
use bity_ic_canister_tracing_macros::trace;
use ic_cdk_macros::{query, update};
pub use sns_neuron_controller_api_canister::update_icp_config::Args as UpdateIcpConfigArgs;
pub use sns_neuron_controller_api_canister::update_icp_config::Response as UpdateIcpConfigResponse;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
async fn update_icp_config_validate(args: UpdateIcpConfigArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
fn update_icp_config(args: UpdateIcpConfigArgs) -> UpdateIcpConfigResponse {
    mutate_state(|state| update_config_impl(args, state))
}

fn update_config_impl(
    args: UpdateIcpConfigArgs,
    state: &mut RuntimeState,
) -> UpdateIcpConfigResponse {
    if let Some(icp_sns_governance_canister_id) = args.icp_sns_governance_canister_id {
        state.data.neuron_managers.icp.nns_governance_canister_id = icp_sns_governance_canister_id;
    }

    if let Some(icp_sns_ledger_canister_id) = args.icp_sns_ledger_canister_id {
        state.data.neuron_managers.icp.nns_ledger_canister_id = icp_sns_ledger_canister_id;
    }

    if let Some(icp_rewards_threshold) = args.icp_rewards_threshold {
        state.data.neuron_managers.icp.icp_rewards_threshold = icp_rewards_threshold;
    }

    UpdateIcpConfigResponse::Success
}
