use crate::guards::caller_is_governance_principal;
use crate::state::read_state;
use crate::types::sns_neuron_manager::NeuronRewardsManager;
use ic_cdk::query;
pub use sns_neuron_controller_api_canister::current_available_rewards::Args as CurrentAvailableRewardsArgs;
pub use sns_neuron_controller_api_canister::current_available_rewards::Response as CurrentAvailableRewardsResponse;


#[query(guard = "caller_is_governance_principal", hidden = true)]
async fn current_available_rewards(args: CurrentAvailableRewardsArgs) -> CurrentAvailableRewardsResponse {
    let goldao_neuron_manager = read_state(|s| s.data.neuron_managers.goldao.clone());
    goldao_neuron_manager.get_available_rewards(args).await
}
