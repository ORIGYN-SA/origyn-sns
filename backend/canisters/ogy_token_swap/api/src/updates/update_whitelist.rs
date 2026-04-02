use candid::{CandidType, Principal};

use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum UpdateWhitelistCommand {
    Add(Principal),
    Remove(Principal),
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {
    pub command: UpdateWhitelistCommand,
}

pub type Response = Result<String, String>;
