use crate::guards::caller_is_governance_principal;
use crate::state::read_state;
use bity_ic_canister_tracing_macros::trace;
use ic_cdk::{query, update};
use nns_governance_canister::types::manage_neuron::Command;
pub use sns_neuron_controller_api_canister::manage_nns_neuron::Args as ManageNnsNeuronArgs;
pub use sns_neuron_controller_api_canister::manage_nns_neuron::Response as ManageNnsNeuronResponse;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
async fn manage_nns_neuron_validate(args: ManageNnsNeuronArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
async fn manage_nns_neuron(args: ManageNnsNeuronArgs) -> ManageNnsNeuronResponse {
    match manage_nns_neuron_impl(args.neuron_id, args.command).await {
        Ok(ok) => ManageNnsNeuronResponse::Success(ok),
        Err(err) => ManageNnsNeuronResponse::InternalError(err),
    }
}

pub(crate) async fn manage_nns_neuron_impl(
    neuron_id: u64,
    command: Command,
) -> Result<String, String> {
    let neuron_manager = read_state(|s| s.data.neuron_managers.icp.clone());

    neuron_manager
        .manage_nns_neuron_impl(neuron_id, command)
        .await
}
