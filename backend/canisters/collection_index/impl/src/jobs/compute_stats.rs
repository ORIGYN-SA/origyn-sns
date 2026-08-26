use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::run_now_then_interval;
use std::time::Duration;
use tracing::debug;
use types::Milliseconds;

const COMPUTE_STATS_JOB_INTERVAL: Milliseconds = 10 * 60 * 1000; // 10 minutes

pub fn start_job() {
    debug!("Starting the job to compute total locked value of collections");
    run_now_then_interval(Duration::from_millis(COMPUTE_STATS_JOB_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(compute_stats());
}

async fn compute_stats() {
    let total_value_locked: u64 = read_state(|state| {
        state
            .data
            .collections
            .get_all_collections()
            .iter()
            .filter_map(|collection| collection.locked_value_usd)
            .sum()
    });

    mutate_state(|state| {
        state.data.overall_stats.collections_total_value_locked = total_value_locked;
        state.data.overall_stats.total_collections =
            state.data.collections.total_collections() as usize;
    });
}
