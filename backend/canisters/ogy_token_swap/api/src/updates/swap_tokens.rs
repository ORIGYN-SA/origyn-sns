use candid::{ CandidType, Principal };
use ic_ledger_types::BlockIndex;
use icrc_ledger_types::icrc1::transfer::BlockIndex as BlockIndexIcrc;
use serde::{ Deserialize, Serialize };

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {
    pub block_index: BlockIndex,
    pub user: Option<Principal>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum Response {
    Success(BlockIndexIcrc),
    InternalError(String),
}
