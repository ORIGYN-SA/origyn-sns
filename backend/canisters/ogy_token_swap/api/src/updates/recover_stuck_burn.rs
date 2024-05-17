use candid::CandidType;
use ic_ledger_types::BlockIndex;
use icrc_ledger_types::icrc1::transfer::BlockIndex as BlockIndexIcrc;
use serde::{Deserialize, Serialize};

use crate::token_swap::{BurnRequestArgs, RecoverBurnMode, SwapStatus};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {
    pub block_index: BlockIndex,
    pub recover_mode: RecoverBurnMode,
    pub validation_data: Option<BurnRequestArgs>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum Response {
    Success(BlockIndexIcrc),
    BurnBlockNotFound,
    NoSwapRequestFound,
    NotAValidBurnBlock(String),
    SwapIsNotStuckInBurn(SwapStatus),
    BurnFailed(String),
    FinalTransferFailed(String),
    InternalError(String),
}
