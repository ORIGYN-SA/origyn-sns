use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub struct GetHoldersArgs {
    pub offset: u64,
    pub limit: u64,
    pub merge_accounts_to_principals: bool,
}
