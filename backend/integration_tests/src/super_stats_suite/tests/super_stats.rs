use std::thread;
use std::time::Duration;

use candid::Nat;
use icrc_ledger_types::icrc1::account::Account;
use super_stats_v3_api::custom_types::IndexerType;
use super_stats_v3_api::stats::queries::get_principal_history::GetPrincipalHistoryArgs;
use super_stats_v3_api::stats::updates::init_target_ledger::{ InitLedgerArgs, TargetArgs };
use utils::consts::E8S_PER_OGY;

use crate::client::icrc1::client::{ balance_of, transfer };
use crate::client::super_stats::{
    get_principal_history, get_working_stats, init_target_ledger, start_processing_timer
};
use crate::super_stats_suite::{ init::init, TestEnv };

use crate::utils::random_principal;

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

    // Wait 15 seconds
    thread::sleep(Duration::from_secs(30));

    let working_stats_response = get_working_stats(
        &mut pic,
        controller,
        super_stats_canister_id,
        &()
    );
    println!("Response from get_working_stats: {working_stats_response:?}");

    // Wait here 15 seconds before proceeding
    thread::sleep(Duration::from_secs(15));

    let p1_args = GetPrincipalHistoryArgs {
        account: principal1.to_string(),
        days: 5,
    };
    let response1 = get_principal_history(&mut pic, controller, super_stats_canister_id, &p1_args);
    println!("Response from get_account_history: {response1:?}");

    // 1 day ago = Day 5
    // principal1: 80_000_000
    assert_eq!(response1[0].1.balance, (80_000_000 * E8S_PER_OGY) as u128);
    // 2 days ago = Day 4
    // principal1: 75_000_000
    assert_eq!(response1[1].1.balance, (75_000_000 * E8S_PER_OGY) as u128);
    // 3 days ago = Day 3
    // principal1: 70_000_000
    assert_eq!(response1[2].1.balance, (70_000_000 * E8S_PER_OGY) as u128);
    // 4 days ago = Day 2
    // principal1: 70_000_000
    assert_eq!(response1[3].1.balance, (80_000_000 * E8S_PER_OGY) as u128);
    // 5 days ago = Day 1
    // principal1: 70_000_000
    assert_eq!(response1[4].1.balance, (100_000_000 * E8S_PER_OGY) as u128);
}
