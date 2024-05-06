use candid::CandidType;
use super_stats_v3::stats::custom_types::HolderBalanceResponse;

#[derive(CandidType)]
pub struct GetTopPrincipalHoldersArgs {
    pub number_to_return: u64,
}
pub type Args = GetTopPrincipalHoldersArgs;
pub type Response = Vec<HolderBalanceResponse>;
