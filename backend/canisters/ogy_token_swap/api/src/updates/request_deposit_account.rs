use candid::{ CandidType, Principal };
use ic_ledger_types::AccountIdentifier;
use serde::Deserialize;

#[derive(Deserialize, CandidType)]
pub struct Args {
    pub of: Option<Principal>,
}

#[derive(Deserialize, CandidType, PartialEq, Debug)]
pub enum Response {
    Success(AccountIdentifier),
    MaxCapacityOfListReached,
}
