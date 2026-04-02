use candid::{CandidType, Nat, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Args {
    pub goldao_sns_governance_canister_id: Option<Principal>,
    pub goldao_sns_ledger_canister_id: Option<Principal>,
    pub goldao_sns_rewards_canister_id: Option<Principal>,
    pub goldao_rewards_threshold: Option<Nat>,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum Response {
    Success,
    InternalError(String),
}
