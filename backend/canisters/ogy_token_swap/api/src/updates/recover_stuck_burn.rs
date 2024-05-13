use candid::CandidType;
use ic_ledger_types::BlockIndex;
use serde::{ Deserialize, Serialize };

use crate::token_swap::SwapStatus;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {
    pub block_index: BlockIndex,
    pub block_index_burn: BlockIndex,
}

#[derive(CandidType, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum Response {
    Success,
    BurnBlockNotFound,
    NoSwapRequestFound,
    NotAValidBurnBlock(String),
    SwapIsNotStuckInBurn(SwapStatus),
    FinalTransferFailed(String),
    InternalError(String),
}
