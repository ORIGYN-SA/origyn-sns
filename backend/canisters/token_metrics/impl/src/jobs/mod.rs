pub mod sync_governance;
pub mod sync_governance_history;
pub mod sync_ledger;
pub mod sync_proposals_stats;
pub mod sync_supply_data;
pub mod update_balance_list;

use bity_ic_canister_time::now_millis;
use token_metrics_api::types::timer_status::TimerStatus;

use crate::state::mutate_state;

pub(crate) fn start() {
    // Computes the staked value for the last 2k days
    sync_governance_history::start_job();
    sync_proposals_stats::start_job();
    // Computes the governance stats, total staked, rewards
    // Updates the balance list (ledger + governance) for each acc
    // Also calculates circulating supply
    sync_governance::start_job();
    update_balance_list::start_job();
}

/// Record the start of a job run. Sets `first_run_at` on the very first invocation.
pub fn record_job_started(name: &str, interval_secs: u64) {
    let now = now_millis();
    mutate_state(|state| {
        let status = state
            .data
            .timer_statuses
            .entry(name.to_string())
            .or_insert_with(|| TimerStatus {
                name: name.to_string(),
                interval_secs,
                ..Default::default()
            });
        if status.first_run_at.is_none() {
            status.first_run_at = Some(now);
        }
    });
}

/// Record the successful completion of a job run.
pub fn record_job_completed(name: &str) {
    let now = now_millis();
    mutate_state(|state| {
        if let Some(status) = state.data.timer_statuses.get_mut(name) {
            status.last_run_at = Some(now);
            status.run_count += 1;
        }
    });
}

/// Record an error during a job run.
pub fn record_job_error(name: &str, error: &str) {
    let now = now_millis();
    mutate_state(|state| {
        let status = state
            .data
            .timer_statuses
            .entry(name.to_string())
            .or_insert_with(|| TimerStatus {
                name: name.to_string(),
                ..Default::default()
            });
        status.last_error = Some(error.to_string());
        status.last_error_at = Some(now);
    });
}
