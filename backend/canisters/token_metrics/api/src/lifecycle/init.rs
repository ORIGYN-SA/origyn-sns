use bity_ic_types::BuildVersion;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use types::CanisterId;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InitArgs {
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub sns_governance_canister_id: CanisterId,
    pub ogy_new_ledger_canister_id: CanisterId,
    pub sns_rewards_canister_id: CanisterId,
    pub treasury_account: String,
    pub foundation_accounts: Vec<String>,
    pub authorized_principals: Vec<Principal>,
}
