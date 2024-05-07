// Updates the governance balance list with ledger balance
// for each principal

use canister_time::run_now_then_interval;
use icrc_ledger_types::icrc1::account;
use super_stats_v3_c2c_client::{
    helpers::account_tree::Overview,
    queries::get_account_holders::GetHoldersArgs,
};
use std::{ collections::HashMap, time::Duration };
use tracing::{ debug, error, info };
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
    info!("update_balance_list");

    let super_stats_canister_id = read_state(|state| state.data.super_stats_canister);

    let (principal_holders_map, account_holders_map) = get_all_holders().await;

    for principal in principals_map.iter() {
    }
}

async fn get_all_holders() -> (HashMap<String, Overview>, HashMap<String, Overview>) {
    let super_stats_canister_id = read_state(|state| state.data.super_stats_canister);

    let mut principal_holders_map: HashMap<String, Overview> = HashMap::new();
    let mut account_holders_map: HashMap<String, Overview> = HashMap::new();

    let mut args = GetHoldersArgs {
        offset: 0,
        limit: 100,
    };
    // Fetch principal holders
    loop {
        let principal_holders = super_stats_v3_c2c_client::get_principal_holders(
            super_stats_canister_id,
            &args
        ).await;

        for response in principal_holders.iter() {
            principal_holders_map.insert(response.holder.clone(), response.data.clone());
        }

        let count = principal_holders.len();
        if count < args.limit {
            break;
        } else {
            args.offset += count;
        }
    }

    // Reset offset and remaining_limit for account holders
    args.offset = 0;

    // Fetch account holders
    loop {
        let account_holders = super_stats_v3_c2c_client::get_account_holders(
            super_stats_canister_id,
            &args
        ).await;

        for response in account_holders.iter() {
            account_holders_map.insert(response.holder.clone(), response.data.clone());
        }

        let count = principal_holders.len();
        if count < args.limit {
            break;
        } else {
            args.offset += count;
        }
    }

    (principal_holders_map, account_holders_map)
}
