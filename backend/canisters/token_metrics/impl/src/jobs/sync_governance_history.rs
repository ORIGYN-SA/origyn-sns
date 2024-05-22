use candid::Nat;
use canister_time::run_now_then_interval;
use futures::future::join_all;
use icrc_ledger_types::icrc1::account::Account;
use super_stats_v3_api::stats::queries::{get_account_history::GetAccountHistoryArgs, get_principal_history::GetPrincipalHistoryArgs};
use token_metrics_api::{GOLD_TREASURY_SUBACCOUNT_STR, TEAM_PRINCIPALS};
use std::{str::FromStr, time::Duration};
use tracing::{ debug, error };
use types::Milliseconds;
use crate::state::{ mutate_state, read_state };

const SYNC_GOVERNANCE_HISTORY_INTERVAL: Milliseconds = 3_600 * 1_000;

pub fn _start_job_if_not_started() {
    run_now_then_interval(Duration::from_millis(SYNC_GOVERNANCE_HISTORY_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(sync_governance_history())
}

pub async fn sync_governance_history() {
    let super_stats_canister_id = read_state(|state| state.data.super_stats_canister);
    let sns_governance_canister_id = read_state(|state| state.data.sns_governance_canister);

    let principal_history_args = GetPrincipalHistoryArgs {
      account: sns_governance_canister_id.to_string(),
      days: 2000
    };

    let treasury_history_args = GetAccountHistoryArgs {
      account: GOLD_TREASURY_SUBACCOUNT_STR.to_string(),
      days: 2000
    };

  

    match super_stats_v3_c2c_client::get_principal_history(super_stats_canister_id, &principal_history_args).await {
        Ok(principal_history) => {
            match super_stats_v3_c2c_client::get_account_history(super_stats_canister_id, &principal_history_args).await {
              Ok(treasury_history) => {

              }
              Err(err) => {
                let message = format!("{err:?}");
                error!(?message, "Error while getting the treasury history");
              }
            }
        }
        Err(err) => {
            let message = format!("{err:?}");
            error!(?message, "Error while getting the governance principal history");
        }
    }
}

