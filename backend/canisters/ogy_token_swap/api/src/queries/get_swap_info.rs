use candid::CandidType;
use ic_ledger_types::BlockIndex;
use serde::Deserialize;

use crate::token_swap::SwapInfo;

#[derive(Deserialize, CandidType)]
pub struct Args {
    pub block_index: BlockIndex,
}

#[derive(Deserialize, CandidType)]
pub enum Response {
    Success(SwapInfo),
    InternalError(String),
}
