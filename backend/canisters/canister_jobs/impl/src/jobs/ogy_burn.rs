use candid::Nat;
use canister_time::{
    is_interval_more_than_1_day,
    run_now_then_interval,
    timestamp_millis,
    timestamp_nanos,
    DAY_IN_MS,
};
use canister_jobs_api::BurnJobResult;
use icrc_ledger_types::icrc1::{ account::Account, transfer::TransferArg };
use std::time::Duration;
use tracing::{ debug, error, info };
use types::Milliseconds;
use crate::state::{ mutate_state, read_state };

const OGY_BURN_JOB_INTERVAL: Milliseconds = DAY_IN_MS;
// Day in nanoseconds minus 1hr

pub fn start_job() {
    debug!("Starting the job to burn OGY...");
    run_now_then_interval(Duration::from_millis(OGY_BURN_JOB_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(send_ogy_to_burn_account())
}

pub async fn send_ogy_to_burn_account() {
    // Prevent the job from running twice a day
    let last_ogy_burn_timestamp = read_state(|state| state.data.jobs_info.last_ogy_burn_timestamp);
    if !is_interval_more_than_1_day(last_ogy_burn_timestamp, timestamp_millis()) {
        info!("send_ogy_to_burn_account => time since last run is less than 1 day");
        return;
    }

    let ledger_canister_id = read_state(|state| state.data.ledger_canister_id);
    let burn_principal = read_state(|state| state.data.burn_principal_id);
    let daily_burn_amount = read_state(|state| state.data.daily_burn_amount);

    let args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: burn_principal,
            subaccount: None,
        },
        amount: Nat::from(daily_burn_amount),
        fee: None,
        created_at_time: Some(timestamp_nanos()),
        memo: None,
    };

    match icrc_ledger_canister_c2c_client::icrc1_transfer(ledger_canister_id, &args).await {
        Ok(Ok(transfer_block_index)) => {
            let job_result = BurnJobResult {
                timestamp: timestamp_nanos(),
                block_height: transfer_block_index,
            };
            mutate_state(|state| {
                state.data.burn_jobs_results.push(job_result);
                state.data.jobs_info.last_ogy_burn_timestamp = timestamp_millis();
            });
        }
        Ok(Err(msg)) => {
            let message = format!("{msg:?}");
            error!(?message, "(1) Error while sending the OGY to burn account.");
        }
        Err((_, msg)) => {
            let message = format!("{msg:?}");
            error!(?message, "(2) Error while sending the OGY to burn account.");
        }
    }
}
