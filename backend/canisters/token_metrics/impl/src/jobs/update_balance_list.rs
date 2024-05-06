// Updates the governance balance list with ledger balance
// for each principal

use canister_time::run_now_then_interval;
use futures::future::join_all;
use std::time::Duration;
use tracing::{ debug, error };
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
    let super_stats_canister_id = read_state(|state| state.data.super_stats_canister);
    match super_stats_v3_c2c_client::get_total_holders(super_stats_canister_id).await {
        Ok(response) => {
            let p_args = super_stats_v3_c2c_client::queries::get_top_principal_holders::Args {
                number_to_return: response.total_principals,
            };
            let a_args = super_stats_v3_c2c_client::queries::get_top_account_holders::Args {
                number_to_return: response.total_accounts,
            };
            let getter_futures: Vec<_> = [
                super_stats_v3_c2c_client::get_top_principal_holders(
                    super_stats_canister_id,
                    &p_args
                ),
                super_stats_v3_c2c_client::get_top_account_holders(
                    super_stats_canister_id,
                    &a_args
                ),
            ]
                .iter()
                .collect();
            let results = join_all(getter_futures).await;
        }
        Err(err) => {
            let message = format!("{err:?}");
            error!(message, "There was an error while getting the total holders")
        }
    }
}
