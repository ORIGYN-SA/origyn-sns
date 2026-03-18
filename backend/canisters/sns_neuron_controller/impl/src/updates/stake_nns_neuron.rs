use crate::guards::caller_is_governance_principal;
use crate::state::read_state;
use bity_ic_canister_tracing_macros::trace;
use ic_cdk::{query, update};
pub use sns_neuron_controller_api_canister::stake_nns_neuron::Args as StakeNnsNeuronArgs;
pub use sns_neuron_controller_api_canister::stake_nns_neuron::Response as StakeNnsNeuronResponse;
use tracing::error;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
async fn stake_nns_neuron_validate(args: StakeNnsNeuronArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
async fn stake_nns_neuron(args: StakeNnsNeuronArgs) -> StakeNnsNeuronResponse {
    let neuron_manager = read_state(|s| s.data.neuron_managers.icp.clone());

    match neuron_manager
        .stake_nns_neuron(args.amount, args.add_disolve_delay)
        .await
    {
        Ok(neuron_id) => StakeNnsNeuronResponse::Success(neuron_id),
        Err(error) => {
            error!(error);
            ic_cdk::println!("Error: {:?}", error);
            StakeNnsNeuronResponse::InternalError(error)
        }
    }
}
