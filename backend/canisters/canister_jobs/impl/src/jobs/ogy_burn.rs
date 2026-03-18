use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::{run_now_then_interval, timestamp_millis, timestamp_nanos, DAY_IN_MS};
use candid::Nat;
use canister_jobs_api::BurnJobResult;
use icrc_ledger_types::icrc1::{account::Account, transfer::TransferArg};
use std::time::Duration;
use tracing::{debug, error, info};
use types::Milliseconds;

const OGY_BURN_JOB_INTERVAL: Milliseconds = DAY_IN_MS;

pub fn start_job() {
    debug!("Starting the job to burn OGY.");
    run_now_then_interval(Duration::from_millis(OGY_BURN_JOB_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(send_ogy_to_burn_account())
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
        Err(err) => {
            let message = format!("{err:?}");
            error!(?message, "(2) Error while sending the OGY to burn account.");
        }
    }
}

use types::TimestampMillis;
pub fn is_interval_more_than_1_day(
    previous_time: TimestampMillis,
    now_time: TimestampMillis,
) -> bool {
    // convert the milliseconds to the number of days since UNIX Epoch.
    // integer division means partial days will be truncated down or effectively rounded down. e.g 245.5 becomes 245
    let previous_in_days = previous_time / DAY_IN_MS;
    let current_in_days = now_time / DAY_IN_MS;
    // never allow distributions to happen twice i.e if the last run distribution in days since UNIX epoch is the same as the current time in days since the last UNIX Epoch then return early.
    current_in_days != previous_in_days
}
