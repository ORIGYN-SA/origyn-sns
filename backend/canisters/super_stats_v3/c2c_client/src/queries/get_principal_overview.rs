use candid::CandidType;
use super_stats_v3::stats::account_tree::Overview;

#[derive(CandidType)]
pub struct SArgs {
    account: String,
}
pub type Args = SArgs;
pub type Response = Option<Overview>;
