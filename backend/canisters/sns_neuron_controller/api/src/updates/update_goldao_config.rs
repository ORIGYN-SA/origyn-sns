use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use types::TokenSymbol;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Args {
    pub goldao_sns_governance_canister_id: Option<Principal>,
    pub goldao_sns_ledger_canister_id: Option<Principal>,
    pub goldao_sns_rewards_canister_id: Option<Principal>,
    pub goldao_rewards_threshold: Option<Nat>,
    /// Update destinations for specific reward tokens. Existing entries not present here are kept.
    pub reward_tokens: Option<HashMap<TokenSymbol, Principal>>,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum Response {
    Success,
    InternalError(String),
}
