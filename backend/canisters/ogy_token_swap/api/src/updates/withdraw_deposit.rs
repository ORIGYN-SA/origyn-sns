use candid::CandidType;
use ic_ledger_types::BlockIndex;
use serde::Deserialize;

pub type Args = ();

#[derive(CandidType, Deserialize, Debug, PartialEq, Eq)]
pub enum Response {
    Success(BlockIndex),
    InsufficientBalance(u64),
    TransferCallError(String),
    TransferError(String),
    FailedToFetchBalance(String),
    NoRecordOfSubaccountRequestFound,
    InternalError(String),
}
