// Updates the governance balance list with ledger balance
// for each principal

use canister_time::run_now_then_interval;
use futures::future::join_all;
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
    super_stats_canister_id = read_state(|state| state.data.super_stats_canister);
    match get_total_holders(super_stats_canister_id).await {
        Ok(response) => {
            let getter_futures: Vec<_> = [
                super_stats_v3_c2c_client::get_top_principal_holders(response.total_principals),
                super_stats_v3_c2c_client::get_top_account_holders(response.total_account),
            ];

            let results = join_all(getter_futures).await;
        }
        Err(err) => {
            let message = format!("{:err?}");
            error!(message, "There was an error while getting the total holders")
        }
    }
}
