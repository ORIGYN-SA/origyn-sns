use candid::{Nat, Principal};
use canister_time::run_now_then_interval;
use futures::future::join_all;
use icrc_ledger_types::{icrc1::account::Account, icrc3::transactions::GetTransactionsRequest};
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
    ic_cdk::spawn(sync_ledger_transactions())
}

pub async fn sync_ledger_transactions() {
    let ledger_canister_id = read_state(|state| state.data.sns_ledger_canister);
    let last_synced_transaction = read_state(|state| state.data.sync_info.last_synced_transaction);

    let mut args: GetTransactionsRequest = GetTransactionsRequest {
        start: Nat::from(last_synced_transaction),
        length: Nat::from(1000u64),
    };

    let mut continue_scanning = true;
    while (continue_scanning) {
        continue_scanning = false;
        match icrc_ledger_canister_c2c_client::get_transactions(ledger_canister_id, &args).await {
            Ok(response) => {
                info!("{:?}", response);
                let number_of_received_transactions = response.transactions.len();
                if number_of_received_transactions == args.length {
                    continue_scanning = true;
                }
                args.start += Nat::from(number_of_received_transactions);
                mutate_state(|state| {
                    let last_synced_transaction: usize = args.start.0.try_into().unwrap();
                    state.data.sync_info.last_synced_transaction = last_synced_transaction;
                })
            }
            Err(err) => {
                let message = format!("{err:?}");
                error!(message, "Error while syncing transactions from the ledger")
            }
        }
    }

    // get_transcations call
}

async fn get_last_transcation_id() -> Result<Nat, String> {
    let ledger_canister_id = read_state(|state| state.data.sns_ledger_canister);

    let args: GetTransactionsRequest = GetTransactionsRequest {
        start: Nat::from(0_u64),
        length: Nat::from(1_u64),
    };
    match icrc_ledger_canister_c2c_client::get_transactions(ledger_canister_id, &args).await {
        Ok(response) => Ok(response.log_length),
        Err(err) => {
            let message =
                format!("There was an error while getting the last transaction id: {err:?}");
            Err(message)
        }
    }
}
