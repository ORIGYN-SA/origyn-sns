use crate::state::read_state;
use ic_cdk_macros::query;
use sns_rewards_api_canister::get_neuron_by_id;
pub use sns_rewards_api_canister::get_neuron_by_id::{
    Args as Get5YNeuronByIdArgs, Response as Get5YNeuronByIdResponse,
};

#[query(hidden = true)]
fn get_5y_neuron_by_id(id: Get5YNeuronByIdArgs) -> Get5YNeuronByIdResponse {
    read_state(|state| {
        state
            .data
            .neuron_system
            .neuron_maturity_5y
            .get(&id)
            .cloned()
    })
}
