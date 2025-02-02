use std::time::Duration;
use tracing::debug;
use types::Milliseconds;
use crate::state::{ read_state, mutate_state };

const COMPUTE_STATS_JOB_INTERVAL: Milliseconds = 10 * 60 * 1000; // 10 minutes

pub fn start_job() {
    debug!("Starting the job to compute total locked value of collections");
    ic_cdk_timers::set_timer_interval(Duration::from_millis(COMPUTE_STATS_JOB_INTERVAL), run);
}

fn run() {
    ic_cdk::spawn(compute_stats());
}

async fn compute_stats() {
    let total_value_locked: u64 = read_state(|state| {
        state.data.collections
            .get_all_collections()
            .iter()
            .filter_map(|collection| collection.locked_value_usd)
            .sum()
    });

    mutate_state(|state| {
        state.data.overall_stats.total_value_locked = total_value_locked;
        state.data.overall_stats.total_collections = state.data.collections
            .get_all_categories()
            .len();
    });
}
