use ic_cdk::query;
use crate::core::working_stats::api_count;
use super_stats_v3_api::{
    runtime::RUNTIME_STATE,
    stable_memory::STABLE_STATE,
    stats::queries::get_activity_stats::{
        Args as GetActivityStatsArgs,
        Response as GetActivityStatsResponse,
    },
};

#[query]
pub fn get_activity_stats(days: GetActivityStatsArgs) -> GetActivityStatsResponse {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    STABLE_STATE.with(|s| {
        s.borrow()
            .as_ref()
            .unwrap()
            .activity_stats.get_daily_snapshots(days as usize)
    })
}
