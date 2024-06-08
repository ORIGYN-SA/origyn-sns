use ic_cdk_macros::query;
pub use daily_jobs_api::queries::get_burn_history::Response as GetBurnHistoryResponse;

use crate::state::read_state;

#[query]
fn get_burn_history() -> GetBurnHistoryResponse {
    read_state(|state| state.data.burn_jobs_results.clone())
}
