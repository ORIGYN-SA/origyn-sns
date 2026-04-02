// cecil-dao/backend/canisters/sns_neuron_controller/impl/src/queries/get_config.rs
use crate::state::read_state;
use bity_ic_canister_tracing_macros::trace;
use ic_cdk_macros::query;
pub use sns_neuron_controller_api_canister::get_config::{
    GetConfigArgs, GetConfigResponse, GoldaoManagerConfig, IcpManagerConfig, ManagerConfig,
    ManagerType, OgyManagerConfig,
};

#[query]
#[trace]
fn get_config(args: GetConfigArgs) -> GetConfigResponse {
    read_state(|state| {
        let config = match args.manager_type {
            ManagerType::GOLDAO => {
                let goldao_manager = &state.data.neuron_managers.goldao;
                ManagerConfig::GoldaoConfig(GoldaoManagerConfig {
                    goldao_sns_governance_canister_id: goldao_manager
                        .goldao_sns_governance_canister_id,
                    goldao_sns_ledger_canister_id: goldao_manager.goldao_sns_ledger_canister_id,
                    goldao_sns_rewards_canister_id: goldao_manager.goldao_sns_rewards_canister_id,
                    goldao_rewards_threshold: goldao_manager.goldao_rewards_threshold.clone(),
                })
            }
            ManagerType::ICP => {
                let icp_manager = &state.data.neuron_managers.icp;
                ManagerConfig::IcpConfig(IcpManagerConfig {
                    nns_governance_canister_id: icp_manager.nns_governance_canister_id,
                    nns_ledger_canister_id: icp_manager.nns_ledger_canister_id,
                    icp_rewards_threshold: icp_manager.icp_rewards_threshold.clone(),
                })
            }
        };
        GetConfigResponse { config }
    })
}
