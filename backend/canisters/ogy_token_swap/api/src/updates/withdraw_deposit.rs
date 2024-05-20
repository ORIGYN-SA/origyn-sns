use candid::CandidType;
use ic_ledger_types::BlockIndex;

pub type Args = ();

#[derive(CandidType)]
pub enum Response {
    Success(BlockIndex),
    InsufficientBalance(u64),
    TransferCallError(String),
    TransferError(String),
    FailedToFetchBalance(String),
    NoRecordOfSubaccountRequestFound,
    InternalError(String),
}
