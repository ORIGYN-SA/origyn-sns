use bity_ic_types::BuildVersion;
use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InitArgs {
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub authorized_principals: Vec<Principal>,
    pub ogy_manager_config: OgyManagerConfig,
    pub goldao_manager_config: GoldaoManagerConfig,
    pub icp_manager_config: IcpManagerConfig,
    pub rewards_destination: Option<Principal>,
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
