/*!
# Reserve pool distribution

- fn distribute_reserve_pool
transfers tokens from reserve pool to the reward pool on a daily basis.
- currently this only happens for OGY
- the daily amount to be transferred is decided via a proposal

*/

use crate::{ state::{ mutate_state, read_state }, utils::transfer_token };
use candid::{ Nat, Principal };
use canister_time::{ is_interval_more_than_1_day, now_millis, run_interval, DAY_IN_MS };
use icrc_ledger_types::icrc1::account::{ Account, Subaccount };
use sns_rewards_api_canister::subaccounts::RESERVE_POOL_SUB_ACCOUNT;
use utils::env::Environment;
use std::time::Duration;
use tracing::{ debug, error, info };
use types::{ Milliseconds, TokenSymbol };

const BURN_INTERVAL: Milliseconds = DAY_IN_MS;

pub fn start_job() {
    run_interval(Duration::from_millis(BURN_INTERVAL), spawn_burn_job);
}

pub fn spawn_burn_job() {
    ic_cdk::spawn(handle_burn_job())
}

pub async fn handle_burn_job() {
    debug!("OGY BURN JOB - START");
    handle_burn_job_impl().await;
    debug!("OGY BURN JOB - FINISH");
}

async fn handle_burn_job_impl() {
    // check OGY is a valid token type
    let token = match TokenSymbol::parse("OGY") {
        Ok(t) => t,
        Err(e) => {
            error!("ERROR : failed to parse OGY token. error : {:?}", e);
            return;
        }
    };
    // get the OGY ledger id
    let ogy_token_info = match read_state(|s| s.data.tokens.get(&token).copied()) {
        Some(token_info) => token_info,
        None => {
            error!("ERROR : failed to get token information and ledger id for token {:?}", &token);
            return;
        }
    };
    // get the daily burn rate
    let amount_to_burn = match read_state(|s| s.data.daily_ogy_burn_rate.clone()) {
        Some(amount) => amount,
        None => {
            debug!("WARNING: daily_ogy_burn_rate is not set - terminating early.");
            return;
        }
    };
    // check we're more than 1 day since the last burn. The last_daily_ogy_burn will be 0 on the first burn because in state it's initialized with ::default() // 0
    let previous_time_ms = read_state(|s| s.data.last_daily_ogy_burn.unwrap_or(0));
    let current_time_ms = now_millis();

    if !is_interval_more_than_1_day(previous_time_ms, current_time_ms) {
        debug!("WARNING : Time since last run is less than 1 day.");
        return;
    }

    // check the reserve pool has enough OGY to correctly transfer ( burn )
    match fetch_balance_of_sub_account(ogy_token_info.ledger_id, RESERVE_POOL_SUB_ACCOUNT).await {
        Ok(balance) => {
            if balance < amount_to_burn.clone() + ogy_token_info.fee {
                debug!(
                    "Balance of reserve pool : {} is too low to make a burn of {} plus a fee of {} ",
                    balance,
                    amount_to_burn,
                    ogy_token_info.fee
                );
                return;
            }
        }
        Err(e) => {
            error!(e);
            return;
        }
    }

    let minting_account = Account {
        owner: read_state(|s| s.data.sns_governance_canister),
        subaccount: None,
    };

    match
        transfer_token(
            RESERVE_POOL_SUB_ACCOUNT,
            minting_account,
            ogy_token_info.ledger_id,
            amount_to_burn.clone()
        ).await
    {
        Ok(_) => {
            info!("SUCCESS : {:?} OGY tokens burned from reserve pool", amount_to_burn);
            mutate_state(|s| {
                s.data.last_daily_ogy_burn = Some(current_time_ms);
            })
        }
        Err(e) => {
            error!(
                "ERROR : OGY failed to transfer from reserve pool to OGY minting account with error : {:?}",
                e
            );
        }
    }
}

async fn fetch_balance_of_sub_account(
    ledger_canister_id: Principal,
    sub_account: Subaccount
) -> Result<Nat, String> {
    match
        icrc_ledger_canister_c2c_client::icrc1_balance_of(
            ledger_canister_id,
            &(Account {
                owner: read_state(|s| s.env.canister_id()),
                subaccount: Some(sub_account),
            })
        ).await
    {
        Ok(t) => { Ok(t) }
        Err(e) => { Err(format!("ERROR: {:?}", e.1)) }
    }
}

#[cfg(test)]
mod tests {
    use canister_time::is_interval_more_than_1_day;

    #[test]
    fn test_is_interval_more_than_1_day() {
        // Scenario 1 - prev time is 1 day prior but less than 24 hours in interval - should be valid
        let prev_time = 1712765654000; // 2024 Apr 10 16:14:14 UTC
        let now_time = 1712834054000; // 2024 Apr 11 11:14:14 UTC
        let is_valid_time = is_interval_more_than_1_day(prev_time, now_time);
        assert_eq!(is_valid_time, true);

        // Scenario 2 - prev time is 0 days prior ( same day ) - should NOT be valid
        let prev_time = 1712793600000; // 2024 Apr 11 00:00:00 UTC
        let now_time = 1712834054000; // 2024 Apr 11 11:14:14 UTC
        let is_valid_time = is_interval_more_than_1_day(prev_time, now_time);
        assert_eq!(is_valid_time, false);

        // Scenario 3 - prev time is 2 days prior - should be valid
        let prev_time = 1712620800000; // 2024 Apr 09 00:00:00 UTC
        let now_time = 1712834054000; // 2024 Apr 11 11:14:14 UTC
        let is_valid_time = is_interval_more_than_1_day(prev_time, now_time);
        assert_eq!(is_valid_time, true);

        // Scenario 4 - prev time is exactly the same as now time - should NOT be valid
        let prev_time = 1712834054000; // 2024 Apr 11 11:14:14 UTC
        let now_time = 1712834054000; // 2024 Apr 11 11:14:14 UTC
        let is_valid_time = is_interval_more_than_1_day(prev_time, now_time);
        assert_eq!(is_valid_time, false);
    }
}
