use crate::state::with_voting_power_ratio;
use ic_cdk_macros::query;
pub use token_metrics_api::queries::get_voting_power_ratio_history::{
    Args as GetVotingPowerRatioHistoryArgs, Response as GetVotingPowerRatioHistoryResponse,
};

#[query]
fn get_voting_power_ratio_history(
    args: GetVotingPowerRatioHistoryArgs,
) -> GetVotingPowerRatioHistoryResponse {
    with_voting_power_ratio(|m| {
        let total = m.len() as usize;
        let clamped = (args.days as usize).min(total);
        let skip = total - clamped;
        m.iter().skip(skip).map(|e| (*e.key(), e.value())).collect()
    })
}
