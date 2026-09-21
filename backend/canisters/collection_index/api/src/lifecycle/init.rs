use bity_ic_types::BuildVersion;
use candid::{CandidType, Principal};
use serde::Deserialize;
use serde::Serialize;

#[derive(Deserialize, Serialize, Debug, CandidType)]
pub struct InitArgs {
    pub authorized_principals: Vec<Principal>,
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub claimlink_canister_id: Principal,
}
