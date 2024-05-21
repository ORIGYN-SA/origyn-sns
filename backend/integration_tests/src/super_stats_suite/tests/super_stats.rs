use std::time::Duration;

use candid::Nat;
use icrc_ledger_types::icrc1::account::Account;
use super_stats_v3_api::custom_types::IndexerType;
use super_stats_v3_api::queries::get_account_history::GetAccountBalanceHistory;
use super_stats_v3_api::stats::updates::init_target_ledger::{ InitLedgerArgs, TargetArgs };
use utils::consts::E8S_PER_OGY;

use crate::client::icrc1::client::{ balance_of, transfer };
use crate::client::super_stats::{get_account_history, init_target_ledger, start_processing_timers};
use crate::super_stats_suite::{ init::init, TestEnv };

use crate::utils::random_principal;

#[test]
fn account_history_created() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ledger_canister_id = canister_ids.ogy_new_ledger;
    let super_stats_canister_id = canister_ids.ogy_super_stats;

    let minting_account = controller;

    let principal1 = Account { owner: random_principal(), subaccount: None };
    let principal2 = Account { owner: random_principal(), subaccount: None };
    let principal3 = Account { owner: random_principal(), subaccount: None };

    // Make the initial mint transaction to principal1
    let amount = 100_000_000 * E8S_PER_OGY;
    assert_eq!(
        transfer(&mut pic, minting_account, ledger_canister_id, None, principal1, amount.into()),
        Ok((0u8).into())
    );

    assert_eq!(balance_of(&pic, ledger_canister_id, principal1), Nat::from(amount));

    // Day 1
    // principal1: 100_000_000
    // principal2: 0
    // principal3: 0

    pic.advance_time(Duration::from_secs(86400));
    let amount = 20_000_000 * E8S_PER_OGY;
    assert_eq!(
        transfer(&mut pic, principal1.owner, ledger_canister_id, None, principal2, amount.into()),
        Ok((1u8).into())
    );

    // Day 2
    // principal1: 80_000_000
    // principal2: 20_000_000
    // principal3: 0

    pic.advance_time(Duration::from_secs(86400));
    let amount = 10_000_000 * E8S_PER_OGY;
    assert_eq!(
        transfer(&mut pic, principal1.owner, ledger_canister_id, None, principal3, amount.into()),
        Ok((2u8).into())
    );

    // Day 3
    // principal1: 70_000_000
    // principal2: 20_000_000
    // principal3: 10_000_000

    pic.advance_time(Duration::from_secs(86400));
    let amount = 5_000_000 * E8S_PER_OGY;
    assert_eq!(
        transfer(&mut pic, principal2.owner, ledger_canister_id, None, principal1, amount.into()),
        Ok((3u8).into())
    );

    // Day 4
    // principal1: 75_000_000
    // principal2: 15_000_000
    // principal3: 10_000_000

    pic.advance_time(Duration::from_secs(86400));
    let amount = 5_000_000 * E8S_PER_OGY;
    assert_eq!(
        transfer(&mut pic, principal3.owner, ledger_canister_id, None, principal1, amount.into()),
        Ok((4u8).into())
    );

    // Day 5
    // principal1: 80_000_000
    // principal2: 15_000_000
    // principal3: 5_000_000

    // Init the target ledger for the super stats
    let super_stats_init_args = InitLedgerArgs {
        target: TargetArgs {
            target_ledger: ledger_canister_id.to_string(),
            hourly_size: 30,
            daily_size: 10,
        },
        index_type: IndexerType::DfinityIcrc2,
    };

    let init_response = init_target_ledger(
        &mut pic,
        controller,
        super_stats_canister_id,
        &super_stats_init_args
    );
    assert_eq!(init_response, "Target canister, fee and decimals set");

    // Make the super_stats start processing ledger blcoks
    let start_processing_response = start_processing_timers(
        &mut pic,
        controller,
        super_stats_canister_id,
        &300u64
    );
    assert_eq!(start_processing_response, "Processing timer has been started");

    // Wait here 1 minute before proceeding
    
    let p1_args = GetAccountBalanceHistory {
        account: principal1.to_string(),
        days: 3,
        merge_subaccounts: true,
    };
    let response1 = get_account_history(&mut pic, controller, super_stats_canister_id, &p1_args);
    // 3 days ago = Day 3
    // principal1: 70_000_000
    assert_eq!(response1[0].1.balance, 70_000_000);
    // 2 days ago = Day 4
    // principal1: 75_000_000
    assert_eq!(response1[1].1.balance, 75_000_000);
    // 1 day ago = Day 5
    // principal1: 80_000_000
    assert_eq!(response1[2].1.balance, 80_000_000);
}
