use candid::{CandidType, Principal};
use serde::Deserialize;
use serde::Serialize;
use bity_ic_types::BuildVersion;
use types::CanisterId;

#[derive(Deserialize, Serialize, Debug, CandidType)]
pub struct InitArgs {
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub ogy_legacy_ledger_canister_id: CanisterId,
    pub ogy_new_ledger_canister_id: CanisterId,
    pub ogy_legacy_minting_account_principal: Principal,
    pub authorized_principals: Vec<Principal>,
}
