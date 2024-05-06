use candid::CandidType;
use super_stats_v3::stats::custom_types::HolderBalanceResponse;

#[derive(CandidType)]
pub struct GetTopAccountHoldersArgs {
    pub number_to_return: u64,
}
pub type Args = GetTopAccountHoldersArgs;
pub type Response = Vec<HolderBalanceResponse>;
