use candid::Principal;
use canister_time::run_now_then_interval;
use icrc_ledger_types::icrc1::account::Account;
use std::time::Duration;
use tracing::{debug, error, info};
use types::Milliseconds;
use utils::consts::TEAM_PRINCIPALS;

use crate::state::{mutate_state, read_state};

const SYNC_SUPPLY_DATA_INTERVAL: Milliseconds = 3_600 * 1_000;

pub fn _start_job_if_not_started() {
    debug!("Starting the sync supply data job...");
    run_now_then_interval(Duration::from_millis(SYNC_SUPPLY_DATA_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(sync_supply_data())
}

pub async fn sync_supply_data() {
    let ledger_canister_id = read_state(|state| state.data.sns_ledger_canister);

    match icrc_ledger_canister_c2c_client::icrc1_total_supply(ledger_canister_id).await {
        Ok(response) => {
            let total_supply = response.0.try_into().unwrap();
            let total_locked = read_state(|state| state.data.all_gov_stats.total_locked);
            let total_foundation_balance =
                get_total_ledger_balance_of_principals(TEAM_PRINCIPALS.to_vec()).await;
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
async fn get_total_ledger_balance_of_principals(principals: Vec<Principal>) -> u64 {
    0
}
async fn get_ledger_balance_of(principal: Principal) -> u64 {
    let ledger_canister_id = read_state(|state| state.data.sns_ledger_canister);
    let args: Account = Account {
        owner: principal,
        subaccount: None,
    };
    match icrc_ledger_canister_c2c_client::icrc1_balance_of(ledger_canister_id, &args).await {
        Ok(response) => response.0.try_into().unwrap(),
        Err(err) => {
            let message = format!("{err:?}");
            let principal_as_text = principal.to_text();
            error!(
                ?message,
                "There was an error while getting balance of {principal_as_text}."
            );
            0
        }
    }
}
