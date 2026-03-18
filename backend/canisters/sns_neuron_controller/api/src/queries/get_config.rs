// cecil-dao/backend/canisters/sns_neuron_controller/api/src/queries/get_config.rs
use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ManagerType {
    OGY,
    GOLDAO,
    ICP,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetConfigArgs {
    pub manager_type: ManagerType,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetConfigResponse {
    pub config: ManagerConfig,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ManagerConfig {
    OgyConfig(OgyManagerConfig),
    GoldaoConfig(GoldaoManagerConfig),
    IcpConfig(IcpManagerConfig),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct OgyManagerConfig {
    pub ogy_sns_governance_canister_id: Principal,
    pub ogy_sns_ledger_canister_id: Principal,
    pub ogy_sns_rewards_canister_id: Principal,
    pub ogy_rewards_threshold: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldaoManagerConfig {
    pub goldao_sns_governance_canister_id: Principal,
    pub goldao_sns_ledger_canister_id: Principal,
    pub goldao_sns_rewards_canister_id: Principal,
    pub goldao_rewards_threshold: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct IcpManagerConfig {
    pub nns_governance_canister_id: Principal,
    pub nns_ledger_canister_id: Principal,
    pub icp_rewards_threshold: Nat,
}
