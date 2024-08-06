use std::thread;
use std::time::Duration;

use candid::Nat;
use icrc_ledger_types::icrc1::account::Account;
use super_stats_v3_api::custom_types::IndexerType;
use super_stats_v3_api::stats::queries::get_principal_history::GetPrincipalHistoryArgs;
use super_stats_v3_api::stats::queries::get_principal_overview::Args as GetPrincipalOverviewArgs;
use super_stats_v3_api::stats::updates::init_target_ledger::{ InitLedgerArgs, TargetArgs };
use utils::consts::E8S_PER_OGY;

use crate::client::icrc1::client::{ balance_of, transfer };
use crate::client::super_stats::{
    get_activity_stats,
    get_principal_history,
    get_working_stats,
    init_target_ledger,
    start_processing_timer,
    get_principal_overview,
};
use crate::super_stats_suite::{ init::init, TestEnv };

use crate::utils::{ random_principal, random_subaccount };

#[test]
fn principal_history_created() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ledger_canister_id = canister_ids.ogy_new_ledger;
    let super_stats_canister_id = canister_ids.ogy_super_stats;

    let minting_account = controller;

    let principal1 = Account { owner: random_principal(), subaccount: None };
    let principal2 = Account { owner: random_principal(), subaccount: None };
    let principal3 = Account { owner: random_principal(), subaccount: None };

    // Make the initial mint transaction to principal1
    assert_eq!(
        transfer(
            &mut pic,
            minting_account,
            ledger_canister_id,
            None,
            principal1,
            (100_000_000 * E8S_PER_OGY).into()
        ),
        Ok((0u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal1),
        Nat::from(100_000_000 * E8S_PER_OGY)
    );
    assert_eq!(balance_of(&pic, ledger_canister_id, principal2), Nat::from(0u64));
    assert_eq!(balance_of(&pic, ledger_canister_id, principal3), Nat::from(0u64));

    // Day 1
    // principal1: 100_000_000
    // principal2: 0
    // principal3: 0

    pic.advance_time(Duration::from_secs(86410));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal2,
            (20_000_000 * E8S_PER_OGY).into()
        ),
        Ok((1u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal1),
        Nat::from(80_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal2),
        Nat::from(20_000_000 * E8S_PER_OGY)
    );
    assert_eq!(balance_of(&pic, ledger_canister_id, principal3), Nat::from(0u64));

    // Day 2
    // principal1: 80_000_000
    // principal2: 20_000_000
    // principal3: 0

    pic.advance_time(Duration::from_secs(86410));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal3,
            (10_000_000 * E8S_PER_OGY).into()
        ),
        Ok((2u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal1),
        Nat::from(70_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal2),
        Nat::from(20_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal3),
        Nat::from(10_000_000 * E8S_PER_OGY)
    );

    // Day 3
    // principal1: 70_000_000
    // principal2: 20_000_000
    // principal3: 10_000_000

    pic.advance_time(Duration::from_secs(86410));
    assert_eq!(
        transfer(
            &mut pic,
            principal2.owner,
            ledger_canister_id,
            None,
            principal1,
            (5_000_000 * E8S_PER_OGY).into()
        ),
        Ok((3u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal1),
        Nat::from(75_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal2),
        Nat::from(15_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal3),
        Nat::from(10_000_000 * E8S_PER_OGY)
    );

    // Day 4
    // principal1: 75_000_000
    // principal2: 15_000_000
    // principal3: 10_000_000

    pic.advance_time(Duration::from_secs(86410));
    assert_eq!(
        transfer(
            &mut pic,
            principal3.owner,
            ledger_canister_id,
            None,
            principal1,
            (5_000_000 * E8S_PER_OGY).into()
        ),
        Ok((4u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal1),
        Nat::from(80_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal2),
        Nat::from(15_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal3),
        Nat::from(5_000_000 * E8S_PER_OGY)
    );

    // Day 5
    // principal1: 80_000_000
    // principal2: 15_000_000
    // principal3: 5_000_000

    // .
    // .
    // .

    // Day 8
    // principal1: 60_000_000
    // principal2: 15_000_000
    // principal3: 25_000_000
    pic.advance_time(Duration::from_secs(3 * 86410));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal3,
            (20_000_000 * E8S_PER_OGY).into()
        ),
        Ok((5u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal1),
        Nat::from(60_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal2),
        Nat::from(15_000_000 * E8S_PER_OGY)
    );
    assert_eq!(
        balance_of(&pic, ledger_canister_id, principal3),
        Nat::from(25_000_000 * E8S_PER_OGY)
    );
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
    let start_processing_response = start_processing_timer(
        &mut pic,
        controller,
        super_stats_canister_id,
        &5u64
    );
    println!("Response from start_processing_response: {start_processing_response:?}");
    assert_eq!(start_processing_response, "Processing timer has been started");

    // Wait 30 seconds
    thread::sleep(Duration::from_secs(1));

    let working_stats_response = get_working_stats(
        &mut pic,
        controller,
        super_stats_canister_id,
        &()
    );
    println!("Response from get_working_stats: {working_stats_response:?}");

    // Wait here 15 seconds before proceeding
    thread::sleep(Duration::from_secs(1));

    // Check max account balances
    let p2_ow_args = principal2.to_string();
    let principal2_overview = get_principal_overview(
        &mut pic,
        controller,
        super_stats_canister_id,
        &p2_ow_args
    );
    assert_eq!(principal2_overview.unwrap().max_balance, (20_000_000 * E8S_PER_OGY) as u128);

    println!("Principal2 overview: {principal2_overview:?}");
    let p1_args = GetPrincipalHistoryArgs {
        account: principal1.to_string(),
        days: 8,
    };
    let response1 = get_principal_history(&mut pic, controller, super_stats_canister_id, &p1_args);
    println!("Response from get_principal_history (p1): {response1:?}");

    // 1 day ago = Day 8
    // principal1: 60_000_000
    assert_eq!(response1[7].1.balance, (60_000_000 * E8S_PER_OGY) as u128);
    // 2 days ago = Day 7
    // principal1: 80_000_000
    assert_eq!(response1[6].1.balance, (80_000_000 * E8S_PER_OGY) as u128);
    // 3 days ago = Day 6
    // principal1: 80_000_000
    assert_eq!(response1[5].1.balance, (80_000_000 * E8S_PER_OGY) as u128);
    // 4 days ago = Day 5
    // principal1: 80_000_000
    assert_eq!(response1[4].1.balance, (80_000_000 * E8S_PER_OGY) as u128);
    // 5 days ago = Day 4
    // principal1: 75_000_000
    assert_eq!(response1[3].1.balance, (75_000_000 * E8S_PER_OGY) as u128);
    // 6 days ago = Day 3
    // principal1: 70_000_000
    assert_eq!(response1[2].1.balance, (70_000_000 * E8S_PER_OGY) as u128);
    // 7 days ago = Day 2
    // principal1: 80_000_000
    assert_eq!(response1[1].1.balance, (80_000_000 * E8S_PER_OGY) as u128);
    // 8 days ago = Day 1
    // principal1: 100_000_000
    assert_eq!(response1[0].1.balance, (100_000_000 * E8S_PER_OGY) as u128);

    let p2_args = GetPrincipalHistoryArgs {
        account: principal2.to_string(),
        days: 2,
    };
    let response2 = get_principal_history(&mut pic, controller, super_stats_canister_id, &p2_args);
    println!("Response from get_principal_history (p2): {response2:?}");

    // 1 day ago = Day 8
    // principal1: 60_000_000
    assert_eq!(response2[1].1.balance, (15_000_000 * E8S_PER_OGY) as u128);
    // 2 days ago = Day 7
    // principal1: 80_000_000
    assert_eq!(response2[0].1.balance, (15_000_000 * E8S_PER_OGY) as u128);
    // // 3 days ago = Day 6
    // // principal1: 80_000_000
    // assert_eq!(response2[5].1.balance, (15_000_000 * E8S_PER_OGY) as u128);
    // // 4 days ago = Day 5
    // // principal1: 80_000_000
    // assert_eq!(response2[4].1.balance, (15_000_000 * E8S_PER_OGY) as u128);
    // // 5 days ago = Day 4
    // // principal1: 75_000_000
    // assert_eq!(response2[3].1.balance, (15_000_000 * E8S_PER_OGY) as u128);
    // // 6 days ago = Day 3
    // // principal1: 70_000_000
    // assert_eq!(response2[2].1.balance, (20_000_000 * E8S_PER_OGY) as u128);
    // // 7 days ago = Day 2
    // // principal1: 80_000_000
    // assert_eq!(response2[1].1.balance, (20_000_000 * E8S_PER_OGY) as u128);
    // // 8 days ago = Day 1
    // // principal1: 100_000_000
    // assert_eq!(response2[0].1.balance, (0 * E8S_PER_OGY) as u128);
}

#[test]
fn accounts_and_principals_history_count() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ledger_canister_id = canister_ids.ogy_new_ledger;
    let super_stats_canister_id = canister_ids.ogy_super_stats;

    let minting_account = controller;

    let principal1 = Account { owner: random_principal(), subaccount: None };
    let principal2 = Account { owner: random_principal(), subaccount: None };
    let principal3 = Account { owner: random_principal(), subaccount: None };

    let principal1_with_subaccount1 = Account {
        owner: principal1.owner,
        subaccount: Some(random_subaccount()),
    };
    let principal2_with_subaccount1 = Account {
        owner: principal2.owner,
        subaccount: Some(random_subaccount()),
    };
    let principal3_with_subaccount1 = Account {
        owner: principal3.owner,
        subaccount: Some(random_subaccount()),
    };

    let principal1_with_subaccount2 = Account {
        owner: principal1.owner,
        subaccount: Some(random_subaccount()),
    };
    let principal2_with_subaccount2 = Account {
        owner: principal2.owner,
        subaccount: Some(random_subaccount()),
    };
    let principal3_with_subaccount3 = Account {
        owner: principal3.owner,
        subaccount: Some(random_subaccount()),
    };

    // Make the initial mint transaction to principal1
    assert_eq!(
        transfer(
            &mut pic,
            minting_account,
            ledger_canister_id,
            None,
            principal1,
            (100_000_000 * E8S_PER_OGY).into()
        ),
        Ok((0u8).into())
    );

    // Day 1
    // total_unique_accounts: 1
    // total_unique_principals: 1

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal2,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((1u8).into())
    );
    // Day 2
    // total_unique_accounts: 2
    // total_unique_principals: 2

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal2_with_subaccount1,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((2u8).into())
    );
    // Day 3
    // total_unique_accounts: 3
    // total_unique_principals: 2

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal2_with_subaccount2,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((3u8).into())
    );
    // Day 4
    // total_unique_accounts: 4
    // total_unique_principals: 2

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal3,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((4u8).into())
    );
    // Day 5
    // total_unique_accounts: 5
    // total_unique_principals: 3

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal1_with_subaccount1,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((5u8).into())
    );
    // Day 6
    // total_unique_accounts: 6
    // total_unique_principals: 3

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal1_with_subaccount2,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((6u8).into())
    );
    // Day 7
    // total_unique_accounts: 7
    // total_unique_principals: 3

    pic.advance_time(Duration::from_secs(86400));
    assert_eq!(
        transfer(
            &mut pic,
            principal1.owner,
            ledger_canister_id,
            None,
            principal3_with_subaccount1,
            (1_000_000 * E8S_PER_OGY).into()
        ),
        Ok((7u8).into())
    );
    // Day 8
    // total_unique_accounts: 8
    // total_unique_principals: 3

    // ---------------------------------------------------------
    // Super stats v3 Initialization & Job

    // Init the target ledger for the super stats
    let super_stats_init_args = InitLedgerArgs {
        target: TargetArgs {
            target_ledger: ledger_canister_id.to_string(),
            hourly_size: 24,
            daily_size: 30,
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
    let start_processing_response = start_processing_timer(
        &mut pic,
        controller,
        super_stats_canister_id,
        &5u64
    );
    println!("Response from start_processing_response: {start_processing_response:?}");
    assert_eq!(start_processing_response, "Processing timer has been started");

    // Wait 30 seconds
    thread::sleep(Duration::from_secs(1));

    let working_stats_response = get_working_stats(
        &mut pic,
        controller,
        super_stats_canister_id,
        &()
    );
    println!("Response from get_working_stats: {working_stats_response:?}");

    // Wait here 15 seconds before proceeding
    // thread::sleep(Duration::from_secs(15));

    // Super stats v3 Initialization & Job
    // ---------------------------------------------------------

    let days_args = 8;
    let as_response = get_activity_stats(&mut pic, controller, super_stats_canister_id, &days_args);
    println!("Response from get_activity_stats: {as_response:?}");

    // Day 9 (as we advanced in the next day after last tx)
    assert_eq!(as_response[7].total_unique_accounts, 8u64);
    assert_eq!(as_response[7].total_unique_principals, 3u64);

    // Day 8
    assert_eq!(as_response[6].total_unique_accounts, 8u64);
    assert_eq!(as_response[6].total_unique_principals, 3u64);

    // Day 7
    assert_eq!(as_response[5].total_unique_accounts, 7u64);
    assert_eq!(as_response[5].total_unique_principals, 3u64);

    // Day 6
    assert_eq!(as_response[4].total_unique_accounts, 6u64);
    assert_eq!(as_response[4].total_unique_principals, 3u64);

    // Day 5
    assert_eq!(as_response[3].total_unique_accounts, 5u64);
    assert_eq!(as_response[3].total_unique_principals, 3u64);

    // Day 4
    assert_eq!(as_response[2].total_unique_accounts, 4u64);
    assert_eq!(as_response[2].total_unique_principals, 2u64);

    // Day 3
    assert_eq!(as_response[1].total_unique_accounts, 3u64);
    assert_eq!(as_response[1].total_unique_principals, 2u64);

    // Day 2
    assert_eq!(as_response[0].total_unique_accounts, 2u64);
    assert_eq!(as_response[0].total_unique_principals, 2u64);
}
