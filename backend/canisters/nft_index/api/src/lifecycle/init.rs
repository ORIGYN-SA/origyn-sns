use candid::{ CandidType, Principal };
use serde::Deserialize;

#[derive(Deserialize, CandidType)]
pub struct InitArgs {
    pub authorized_principals: Vec<Principal>,
    pub test_mode: bool,
}
