use candid::Nat;
use canister_time::{ run_now_then_interval, timestamp_nanos };
use icrc_ledger_types::icrc1::{ account::Account, transfer::TransferArg };
use std::time::Duration;
use tracing::{ debug, error };
use types::Milliseconds;
use crate::state::{ mutate_state, read_state };

const OGY_BURN_JOB_INTERVAL: Milliseconds = 3_600 * 1_000;

pub fn start_job() {
    debug!("Starting the job to burn OGY...");
    run_now_then_interval(Duration::from_millis(OGY_BURN_JOB_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(send_ogy_to_burn_account())
}

pub async fn send_ogy_to_burn_account() {
    let ledger_canister_id = read_state(|state| state.data.ledger_canister_id);
    let burn_account = read_state(|state| state.data.ledger_canister_id);
    let daily_burn_amount = read_state(|state| state.data.daily_burn_amount);

    let args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: burn_account,
            subaccount: None,
        },
        amount: Nat::from(daily_burn_amount),
        fee: None,
        created_at_time: Some(timestamp_nanos()),
        memo: None,
    };

    match icrc_ledger_canister_c2c_client::icrc1_transfer(ledger_canister_id, &args).await {
        Ok(Ok(transfer_block_index)) => {
            mutate_state(|state| {
                state.data.jobs_info.last_ogy_burn_timestamp = timestamp_nanos();
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
