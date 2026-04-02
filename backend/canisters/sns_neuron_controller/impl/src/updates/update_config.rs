use crate::guards::caller_is_governance_principal;
use crate::state::{mutate_state, RuntimeState};
use bity_ic_canister_tracing_macros::trace;
use ic_cdk_macros::{query, update};
pub use sns_neuron_controller_api_canister::update_config::Args as UpdateConfigArgs;
pub use sns_neuron_controller_api_canister::update_config::Response as UpdateConfigResponse;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
async fn update_config_validate(args: UpdateConfigArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
fn update_config(args: UpdateConfigArgs) -> UpdateConfigResponse {
    mutate_state(|state| update_config_impl(args, state))
}

fn update_config_impl(args: UpdateConfigArgs, state: &mut RuntimeState) -> UpdateConfigResponse {
    state.data.rewards_destination = args.rewards_destination;

    UpdateConfigResponse::Success
}
