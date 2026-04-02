use bity_ic_canister_time::{DAY_IN_MS, HOUR_IN_MS, MINUTE_IN_MS, WEEK_IN_MS};
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use sns_rewards_api_canister::{
    get_historic_payment_round::{self, Args as GetHistoricPaymentRoundArgs},
    subaccounts::REWARD_POOL_SUB_ACCOUNT,
};
use std::time::Duration;
use types::TokenSymbol;

use crate::{
    client::{
        icrc1::client::{balance_of, transfer},
        rewards::{get_active_payment_rounds, get_historic_payment_round, get_neuron_by_id},
    },
    sns_rewards_suite::setup::{default_test_setup, setup::setup_reward_pools},
    utils::{is_interval_more_than_7_days, tick_n_blocks},
};

#[test]
fn test_distribute_rewards_happy_path() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();

    let icp_ledger_id = test_env
        .token_ledgers
        .get("icp_ledger_canister_id")
        .unwrap()
        .clone();
    let controller = test_env.controller;
    let rewards_canister_id = test_env.rewards_canister_id;

    let icp_token = TokenSymbol::ICP;
    let ogy_token = TokenSymbol::OGY;
    let goldao_token = TokenSymbol::GOLDAO;

    let neuron_id_1 = test_env
        .neuron_data
        .get(&0usize)
        .unwrap()
        .clone()
        .id
        .unwrap();

    tick_n_blocks(&pic, 10);

    // ********************************
    // 1. Distribute rewards
    // ********************************
    let n = pic.get_time();
    println!("now is : {n:?}");
    // TRIGGER - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(2);
    tick_n_blocks(&pic, 20);
    pic.advance_time(Duration::from_millis(DAY_IN_MS)); // 9:00am Wednesday 19th June

    tick_n_blocks(&pic, 100);

    // TRIGGER - distribution
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // 14:00
    tick_n_blocks(&pic, 40);

    // ********************************
    // 2. Check Neuron sub account got paid correctly
    // ********************************

    let fees = (test_env.neuron_data.len() as u64) * 10_000 + 10_000;
    let payment_round_pool_amount = (100_000_000_000u64 - fees) as f64;
    let total_maturity: f64 = ((test_env.neuron_data.len() as u64) * 100_000u64) as f64;
    let percentage = (100_000 as f64) / total_maturity;
    let expected_reward = (payment_round_pool_amount * percentage) as u64;
    assert_eq!(expected_reward, 9_999_989_000);

    let neuron_sub_account = Account {
        owner: rewards_canister_id,
        subaccount: Some(neuron_id_1.clone().into()),
    };
    let neuron_icp_balance = balance_of(&pic, icp_ledger_id, neuron_sub_account);
    assert_eq!(neuron_icp_balance, expected_reward);
    pic.tick();

    // ********************************
    // 3. Distribute rewards
    // ********************************

    setup_reward_pools(
        &pic,
        &test_env.sns_gov_canister_id,
        &rewards_canister_id,
        &test_env.token_ledgers.values().cloned().collect(),
        100_000_000_000u64,
    );

    // Trigger - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(3);
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 19)); // 9am
    tick_n_blocks(&pic, 30);

    // TRIGGER - distribution
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5 + DAY_IN_MS * 6)); // 2pm
    tick_n_blocks(&pic, 30);

    let neuron_sub_account = Account {
        owner: rewards_canister_id,
        subaccount: Some(neuron_id_1.clone().into()),
    };
    let neuron_icp_balance = balance_of(&pic, icp_ledger_id, neuron_sub_account);
    assert_eq!(neuron_icp_balance, expected_reward);

    // ********************************
    // 4. There should be no active payment rounds
    // ********************************

    let active_payment_rounds =
        get_active_payment_rounds(&pic, controller, rewards_canister_id, &());
    assert_eq!(active_payment_rounds.len(), 0);

    // ********************************
    // 4. neuron should have rewarded maturity
    // ********************************

    let single_neuron =
        get_neuron_by_id(&pic, controller, rewards_canister_id, &neuron_id_1).unwrap();
    let rewarded_mat_icp = single_neuron.rewarded_maturity.get(&icp_token).unwrap();
    let rewarded_mat_ogy = single_neuron.rewarded_maturity.get(&ogy_token).unwrap();
    let rewarded_mat_goldao = single_neuron.rewarded_maturity.get(&goldao_token).unwrap();
    assert_eq!(rewarded_mat_icp, &100_000u64);
    assert_eq!(rewarded_mat_ogy, &100_000u64);
    assert_eq!(rewarded_mat_goldao, &100_000u64);
}

#[test]
fn test_distribute_rewards_with_no_icp_rewards() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();

    let icp_ledger_id = test_env
        .token_ledgers
        .get("icp_ledger_canister_id")
        .unwrap()
        .clone();
    let ogy_ledger_id = test_env
        .token_ledgers
        .get("ogy_ledger_canister_id")
        .unwrap()
        .clone();
    let controller = test_env.controller;
    let rewards_canister_id = test_env.rewards_canister_id;

    let icp_token = TokenSymbol::ICP;
    let ogy_token = TokenSymbol::OGY;
    let goldao_token = TokenSymbol::GOLDAO;

    let neuron_id_1 = test_env
        .neuron_data
        .get(&0usize)
        .unwrap()
        .clone()
        .id
        .unwrap();

    transfer(
        &pic,
        rewards_canister_id,
        icp_ledger_id,
        Some(REWARD_POOL_SUB_ACCOUNT),
        Account {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        100_000_000_000u128 - 10_000u128,
    )
    .unwrap();
    tick_n_blocks(&pic, 10);

    // ********************************
    // 1. Distribute rewards
    // ********************************
    let n = pic.get_time();
    println!("now is : {n:?}");
    // TRIGGER - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(2);
    tick_n_blocks(&pic, 20);
    pic.advance_time(Duration::from_millis(DAY_IN_MS)); // 9:00am Wednesday 19th June

    tick_n_blocks(&pic, 100);

    // TRIGGER - distribution
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // 14:00
    tick_n_blocks(&pic, 40);

    // ********************************
    // 2. Check Neuron sub account got paid correctly
    // ********************************

    let fees = (test_env.neuron_data.len() as u64) * 200_000 + 200_000;
    let payment_round_pool_amount = (100_000_000_000u64 - fees) as f64;
    let total_maturity: f64 = ((test_env.neuron_data.len() as u64) * 100_000u64) as f64;
    let percentage = (100_000 as f64) / total_maturity;
    let expected_reward = (payment_round_pool_amount * percentage) as u64;
    assert_eq!(expected_reward, 9999780000);

    let neuron_sub_account = Account {
        owner: rewards_canister_id,
        subaccount: Some(neuron_id_1.clone().into()),
    };
    let neuron_icp_balance = balance_of(&pic, icp_ledger_id, neuron_sub_account);
    assert_eq!(neuron_icp_balance, 0_u64);
    let neuron_ogy_balance = balance_of(&pic, ogy_ledger_id, neuron_sub_account);
    assert_eq!(neuron_ogy_balance, expected_reward);
    pic.tick();

    let single_neuron = get_neuron_by_id(
        &pic,
        Principal::anonymous(),
        rewards_canister_id,
        &neuron_id_1,
    )
    .unwrap();
    let rewarded_mat_icp = single_neuron.rewarded_maturity.get(&icp_token.clone());
    let rewarded_mat_ogy = single_neuron.rewarded_maturity.get(&ogy_token).unwrap();
    let rewarded_mat_goldao = single_neuron.rewarded_maturity.get(&goldao_token).unwrap();

    assert_eq!(rewarded_mat_icp, None);
    assert_eq!(rewarded_mat_ogy, &100_000u64);
    assert_eq!(rewarded_mat_goldao, &100_000u64);

    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args {
            token: icp_token.clone(),
            round_id: 1,
        }),
    );
    assert_eq!(res.len(), 0);
}

// if 1 reward pool doesn't have enough rewards it should be skipped
#[test]
fn test_distribute_rewards_with_not_enough_rewards() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();

    let icp_ledger_id = test_env
        .token_ledgers
        .get("icp_ledger_canister_id")
        .unwrap()
        .clone();
    let ogy_ledger_id = test_env
        .token_ledgers
        .get("ogy_ledger_canister_id")
        .unwrap()
        .clone();
    let goldao_ledger_id = test_env
        .token_ledgers
        .get("goldao_ledger_canister_id")
        .unwrap()
        .clone();
    let rewards_canister_id = test_env.rewards_canister_id;

    let icp_token = TokenSymbol::parse("ICP").unwrap();
    let ogy_token = TokenSymbol::OGY;
    let goldao_token = TokenSymbol::GOLDAO;

    // ********************************
    // 1. Give ICP reward pool balance less than the total in fees
    // ********************************
    let reward_pool = Account {
        owner: rewards_canister_id,
        subaccount: Some(REWARD_POOL_SUB_ACCOUNT),
    };
    // calculate the minimum balance
    let minimum_reward_pool_required = 10_000u64 * (test_env.neuron_data.len() as u64) + 10_000u64;
    let bad_starting_reward_amount = minimum_reward_pool_required - 10_000;
    // transfer from reward pool to some random id
    transfer(
        &pic,
        rewards_canister_id,
        icp_ledger_id,
        Some(REWARD_POOL_SUB_ACCOUNT),
        Account {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        100_000_000_000u128 - 10_000u128 - (bad_starting_reward_amount as u128),
    )
    .unwrap();

    let icp_reward_pool_balance = balance_of(&pic, icp_ledger_id, reward_pool);
    assert_eq!(
        icp_reward_pool_balance,
        Nat::from(bad_starting_reward_amount)
    );

    let ogy_reward_pool_balance = balance_of(&pic, ogy_ledger_id, reward_pool);
    assert_eq!(ogy_reward_pool_balance, Nat::from(100_000_000_000u64));

    let goldao_reward_pool_balance = balance_of(&pic, goldao_ledger_id, reward_pool);
    assert_eq!(goldao_reward_pool_balance, Nat::from(100_000_000_000u64));

    // ********************************
    // 2. Distribute rewards
    // ********************************

    // TRIGGER - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(2);
    pic.advance_time(Duration::from_millis(DAY_IN_MS * 1)); //
    tick_n_blocks(&pic, 10);

    // TRIGGER - distribution
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 6)); // 15:00
    tick_n_blocks(&pic, 20);

    // there should be no historic payment round for ICP
    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args {
            token: icp_token,
            round_id: 1,
        }),
    );
    assert_eq!(res.len(), 0);
    // there should be no active round for ICP
    let p = get_active_payment_rounds(&pic, Principal::anonymous(), rewards_canister_id, &());
    assert_eq!(p.len(), 0);

    // the others should have historic rounds
    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args {
            token: ogy_token,
            round_id: 1,
        }),
    );
    assert_eq!(res.len(), 1);
    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args {
            token: goldao_token,
            round_id: 1,
        }),
    );
    assert_eq!(res.len(), 1);
}

#[test]
fn test_distribute_rewards_adds_to_history_correctly() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();

    // Wed Jun 19 2024 04:00:00 GMT
    let mut current_ms = 1718769600000u64;
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 10);

    let ogy_ledger_id = test_env
        .token_ledgers
        .get("ogy_ledger_canister_id")
        .unwrap()
        .clone();
    let icp_token = TokenSymbol::parse("ICP").unwrap();

    // --- DAY 1: ROUND 1 ---
    // 1. Setup funds first
    setup_reward_pools(
        &pic,
        &test_env.sns_gov_canister_id,
        &test_env.rewards_canister_id,
        &test_env.token_ledgers.values().cloned().collect(),
        100_000_000_000u64,
    );

    // 2. VOTE first to increase maturity in Governance
    test_env.simulate_neuron_voting(10);
    tick_n_blocks(&pic, 10);

    // 3. Move to 09:05 - SYNC now picks up the new maturity
    current_ms += (5 * 60 + 5) * 60 * 1000;
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 20); // Let the heartbeat trigger synchronise_neuron_data
    println!("time1: {:?}", pic.get_time());

    // 4. Move to 14:05 - DISTRIBUTE
    current_ms += 5 * 60 * 60 * 1000;
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 50); // Give it plenty of time to finish ledger transfers
    println!("time2: {:?}", pic.get_time());

    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        test_env.rewards_canister_id,
        &GetHistoricPaymentRoundArgs {
            token: icp_token.clone(),
            round_id: 1,
        },
    );
    assert_eq!(res.len(), 1, "Failed to find ICP Round 1");

    // --- DAY 2: ROUND 2 ---
    // 1. Vote again
    test_env.simulate_neuron_voting(10);
    tick_n_blocks(&pic, 20);

    // 2. Move to Day 2 09:05 (Sync)
    current_ms += 19 * 60 * 60 * 1000;
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 20);
    println!("time3: {:?}", pic.get_time());

    // 3. Move to Day 2 14:05 (Distribute)
    current_ms += 5 * 60 * 60 * 1000;
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 50);
    println!("time4: {:?}", pic.get_time());

    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        test_env.rewards_canister_id,
        &GetHistoricPaymentRoundArgs {
            token: icp_token.clone(),
            round_id: 1,
        },
    );
    println!("res: {:?}", res);
    assert_eq!(res.len(), 1, "Failed to find ICP Round 1");

    // --- DAY 8: OGY DEPLETION (ROUND 2) ---

    test_env.simulate_neuron_voting(20);
    tick_n_blocks(&pic, 10);

    // Drain OGY pool
    setup_reward_pools(
        &pic,
        &test_env.sns_gov_canister_id,
        &test_env.rewards_canister_id,
        &test_env.token_ledgers.values().cloned().collect(),
        100_000_000_000u64,
    );
    transfer(
        &pic,
        test_env.rewards_canister_id,
        ogy_ledger_id,
        Some(REWARD_POOL_SUB_ACCOUNT),
        Account {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        100_000_000_000u128 - 200_000u128,
    )
    .unwrap();

    // 2. Move to Day 8 09:05 (Sync)
    current_ms += 19 * 60 * 60 * 1000 + DAY_IN_MS * 6; // advance time to next week
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 20);
    println!("time5: {:?}", pic.get_time());

    // 3. Move to Day 8 14:05 (Distribute)
    current_ms += 5 * 60 * 60 * 1000;
    pic.set_time((std::time::UNIX_EPOCH + std::time::Duration::from_millis(current_ms)).into());
    tick_n_blocks(&pic, 50);
    println!("time6: {:?}", pic.get_time());

    let res = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        test_env.rewards_canister_id,
        &GetHistoricPaymentRoundArgs {
            token: icp_token.clone(),
            round_id: 2,
        },
    );
    println!("res: {:?}", res);
    assert_eq!(res.len(), 1, "Failed to find ICP Round 2");
}

#[test]
fn test_distribution_interval_is_consistant_across_upgrades() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();
    let rewards_canister_id = test_env.rewards_canister_id;
    let icp_token = TokenSymbol::parse("ICP").unwrap();
    // ********************************
    // 2. Distribute rewards - first week
    // ********************************
    tick_n_blocks(&pic, 10);
    setup_reward_pools(
        &pic,
        &test_env.sns_gov_canister_id,
        &rewards_canister_id,
        &test_env.token_ledgers.values().cloned().collect(),
        100_000_000_000u64,
    );
    tick_n_blocks(&pic, 10);

    // TRIGGER - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(2);
    pic.advance_time(Duration::from_millis(DAY_IN_MS * 1)); //
    tick_n_blocks(&pic, 10);

    // trigger the upgrade
    test_env.upgrade_rewards_canister();

    // TRIGGER - distribution
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 6)); // 15:00
    tick_n_blocks(&pic, 20);

    // ********************************
    // 3. There should be 1 historic payment round even though we upgraded
    // ********************************

    let distribution_1_record = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args {
            token: icp_token.clone(),
            round_id: 1,
        }),
    );
    assert_eq!(distribution_1_record.len(), 1);
}
