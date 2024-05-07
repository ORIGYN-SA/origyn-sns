use candid::CandidType;

use crate::helpers::custom_types::HolderBalanceResponse;

#[derive(CandidType)]
pub struct GetHoldersArgs {
    pub offset: u64,
    pub limit: u64,
}

pub type Args = GetHoldersArgs;
pub type Response = Vec<HolderBalanceResponse>;
