use crate::guards::caller_is_governance_principal;
use crate::state::{mutate_state, RuntimeState};
use bity_ic_canister_tracing_macros::trace;
use ic_cdk_macros::{query, update};
pub use sns_neuron_controller_api_canister::update_goldao_config::Args as UpdateGoldaoConfigArgs;
pub use sns_neuron_controller_api_canister::update_goldao_config::Response as UpdateGoldaoConfigResponse;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
async fn update_goldao_config_validate(args: UpdateGoldaoConfigArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
fn update_goldao_config(args: UpdateGoldaoConfigArgs) -> UpdateGoldaoConfigResponse {
    mutate_state(|state| update_config_impl(args, state))
}

fn update_config_impl(
    args: UpdateGoldaoConfigArgs,
    state: &mut RuntimeState,
) -> UpdateGoldaoConfigResponse {
    if let Some(goldao_sns_governance_canister_id) = args.goldao_sns_governance_canister_id {
        state
            .data
            .neuron_managers
            .goldao
            .goldao_sns_governance_canister_id = goldao_sns_governance_canister_id;
    }

    if let Some(goldao_sns_ledger_canister_id) = args.goldao_sns_ledger_canister_id {
        state
            .data
            .neuron_managers
            .goldao
            .goldao_sns_ledger_canister_id = goldao_sns_ledger_canister_id;
    }

    if let Some(goldao_sns_rewards_canister_id) = args.goldao_sns_rewards_canister_id {
        state
            .data
            .neuron_managers
            .goldao
            .goldao_sns_rewards_canister_id = goldao_sns_rewards_canister_id;
    }

    if let Some(goldao_rewards_threshold) = args.goldao_rewards_threshold {
        state.data.neuron_managers.goldao.goldao_rewards_threshold = goldao_rewards_threshold;
    }

    UpdateGoldaoConfigResponse::Success
}
