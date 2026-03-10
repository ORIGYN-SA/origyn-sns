use candid::{CandidType, Principal};
use serde::Deserialize;
use serde::Serialize;
use bity_ic_types::BuildVersion;

#[derive(Deserialize, Serialize, Debug, CandidType)]
pub struct InitArgs {
    pub authorized_principals: Vec<Principal>,
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
}
