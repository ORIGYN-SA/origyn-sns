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
    let ledger_canister_id = read_state(|state| state.data.sns_ledger_canister);
    let principal_gov_stats = read_state(|state| state.data.principal_gov_stats);

    match icrc_ledger_canister_c2c_client::icrc1_total_supply(ledger_canister_id).await {
        Ok(response) => {
            let total_supply = response.0.try_into().unwrap();
            let total_locked = read_state(|state| state.data.all_gov_stats.total_locked);
            let total_foundation_balance =
                get_total_ledger_balance_of_accounts(TEAM_PRINCIPALS.to_vec()).await;
            info!(total_foundation_balance, "Total team balance");
            let circulating_supply = total_supply - total_locked - total_foundation_balance;

            mutate_state(|state| {
                state.data.supply_data.total_supply = total_supply;
                state.data.supply_data.circulating_supply = circulating_supply;
            });
        }
        Err(err) => {
            let message = format!("{err:?}");
            error!(?message, "Error while getting the total supply data");
        }
    }
}
