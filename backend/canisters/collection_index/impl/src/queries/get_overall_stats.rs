use crate::state::mutate_state;
use bity_ic_canister_tracing_macros::trace;
pub use collection_index_api::get_overall_stats::{
    Args as GetOverallStatsArgs, Response as GetOverallStatsResponse,
};
use ic_cdk::query;

#[query]
#[trace]
pub async fn get_overall_stats(_args: GetOverallStatsArgs) -> GetOverallStatsResponse {
    Ok(mutate_state(|state| state.data.overall_stats.clone()))
}
