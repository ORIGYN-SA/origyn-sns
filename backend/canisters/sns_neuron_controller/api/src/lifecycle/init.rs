use bity_ic_types::BuildVersion;
use candid::{CandidType, Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use types::TokenSymbol;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InitArgs {
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub authorized_principals: Vec<Principal>,
    pub goldao_manager_config: GoldaoManagerConfig,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct WtnManagerConfig {
    pub wtn_sns_governance_canister_id: Principal,
    pub wtn_sns_ledger_canister_id: Principal,
    pub wtn_rewards_threshold: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldaoManagerConfig {
    pub goldao_sns_governance_canister_id: Principal,
    pub goldao_sns_ledger_canister_id: Principal,
    pub goldao_sns_rewards_canister_id: Principal,
    /// Maps each reward token to its distribution destination
    pub reward_tokens: HashMap<TokenSymbol, TokenParams>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct IcpManagerConfig {
    pub nns_governance_canister_id: Principal,
    pub nns_ledger_canister_id: Principal,
    pub icp_rewards_threshold: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TokenParams {
    pub destination: Account,
    pub threshold: u128,
}
