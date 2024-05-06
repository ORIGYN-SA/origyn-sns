// Updates the governance balance list with ledger balance
// for each principal

use canister_time::run_now_then_interval;
use std::time::Duration;
use tracing::debug;
use types::Milliseconds;

use crate::state::read_state;

const UPDATE_LEDGER_BALANCE_LIST: Milliseconds = 3_600 * 1_000;

pub fn _start_job_if_not_started() {
    debug!("Starting the update ledger balance list job...");
    run_now_then_interval(Duration::from_millis(UPDATE_LEDGER_BALANCE_LIST), run)
}

pub fn run() {
    ic_cdk::spawn(update_balance_list())
}

pub async fn update_balance_list() {
    // let ledger_canister_id = read_state(|state| state.data.sns_ledger_canister);
    // let principal_gov_stats = read_state(|state| state.data.principal_gov_stats);
}
