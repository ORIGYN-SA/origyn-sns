use canister_tracing_macros::trace;
pub use collection_index_api::get_overall_stats::{
    Args as GetOverallStatsArgs,
    Response as GetOverallStatsResponse,
};
use ic_cdk::query;
use crate::state::mutate_state;

#[query]
#[trace]
pub async fn get_overall_stats(_args: GetOverallStatsArgs) -> GetOverallStatsResponse {
    Ok(mutate_state(|state| state.data.overall_stats.clone()))
}
