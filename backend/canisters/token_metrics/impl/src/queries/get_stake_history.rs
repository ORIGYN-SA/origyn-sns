use crate::state::with_gov_stake_history;
use ic_cdk_macros::query;
pub use token_metrics_api::queries::get_stake_history::{
    Args as GetStakeHistoryArgs, Response as GetStakeHistoryResponse,
};

#[query]
fn get_stake_history(days: GetStakeHistoryArgs) -> GetStakeHistoryResponse {
    with_gov_stake_history(|m| {
        let total = m.len() as usize;
        let clamped = days.min(total);
        let skip = total - clamped;
        m.iter().skip(skip).map(|e| (*e.key(), e.value())).collect()
    })
}
