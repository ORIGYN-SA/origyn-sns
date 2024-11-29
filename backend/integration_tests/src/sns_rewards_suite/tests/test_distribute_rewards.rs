use std::time::Duration;

use candid::{ Nat, Principal };
use canister_time::{ DAY_IN_MS, HOUR_IN_MS };
use icrc_ledger_types::icrc1::account::Account;
use sns_rewards_api_canister::{
    get_historic_payment_round::{ self, Args as GetHistoricPaymentRoundArgs },
    subaccounts::REWARD_POOL_SUB_ACCOUNT,
};
use types::TokenSymbol;

use crate::{
    client::{
        icrc1::client::{ balance_of, transfer },
        rewards::{ get_active_payment_rounds, get_historic_payment_round, get_neuron_by_id },
    },
    setup::setup_reward_pools,
    sns_rewards_suite::init::default_test_setup,
    utils::tick_n_blocks,
};

#[test]
fn test_distribute_rewards_happy_path() {
    let mut test_env = default_test_setup();

    let ogy_ledger_id = test_env.token_ledgers.get("ogy_ledger_canister_id").unwrap().clone();
    let controller = test_env.controller;
    let rewards_canister_id = test_env.rewards_canister_id;
    let ogy_token = TokenSymbol::parse("OGY").unwrap();

    let neuron_id_1 = test_env.neuron_data.get(&0usize).unwrap().clone().id.unwrap();

    // ********************************
    // 1. Distribute rewards
    // ********************************

    // TRIGGER - synchronize_neurons
    test_env.simulate_neuron_voting(2);
    test_env.pic.advance_time(Duration::from_millis(DAY_IN_MS * 1)); //
    tick_n_blocks(&test_env.pic, 10);

    // TRIGGER - distribution
    test_env.pic.advance_time(Duration::from_millis(HOUR_IN_MS * 6)); // 15:00
    tick_n_blocks(&test_env.pic, 20);

    // ********************************
    // 2. Check Neuron sub account got paid correctly
    // ********************************

    let fees = (test_env.neuron_data.len() as u64) * 200_000 + 200_000; // 2_200_000
    let payment_round_pool_amount = (100_000_000_000u64 - fees) as f64; // 99_997_800_000
    let total_maturity: f64 = ((test_env.neuron_data.len() as u64) * 100_000u64) as f64; // 1_000_000
    let individual_percentage = (100_000 as f64) / total_maturity; // 100_000 ( 0.10 )
    let individual_expected_reward = (payment_round_pool_amount * individual_percentage) as u64;
    assert_eq!(individual_expected_reward, 9_999_780_000);

    let neuron_sub_account = Account {
        owner: rewards_canister_id,
        subaccount: Some(neuron_id_1.clone().into()),
    };
    let neuron_ogy_balance = balance_of(&test_env.pic, ogy_ledger_id, neuron_sub_account);
    assert_eq!(neuron_ogy_balance, individual_expected_reward);
    test_env.pic.tick();

    // ********************************
    // 3. Distribute rewards
    // ********************************

    test_env.simulate_neuron_voting(3);
    setup_reward_pools(
        &mut test_env.pic,
        &test_env.sns_gov_canister_id,
        &rewards_canister_id,
        &test_env.token_ledgers.values().cloned().collect(),
        100_000_000_000u64
    );

    // Trigger - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(3);
    test_env.pic.advance_time(Duration::from_millis(HOUR_IN_MS * 18)); // 9am
    tick_n_blocks(&test_env.pic, 30);

    // TRIGGER - distribution
    test_env.pic.advance_time(Duration::from_millis(HOUR_IN_MS * 6 + DAY_IN_MS * 6)); // 3pm
    tick_n_blocks(&test_env.pic, 30);

    let neuron_sub_account = Account {
        owner: rewards_canister_id,
        subaccount: Some(neuron_id_1.clone().into()),
    };
    let neuron_ogy_balance = balance_of(&test_env.pic, ogy_ledger_id, neuron_sub_account);
    assert_eq!(neuron_ogy_balance, individual_expected_reward * 2);

    // ********************************
    // 4. There should be no active payment rounds
    // ********************************

    let active_payment_rounds = get_active_payment_rounds(
        &test_env.pic,
        controller,
        rewards_canister_id,
        &()
    );
    assert_eq!(active_payment_rounds.len(), 0);

    // ********************************
    // 4. neuron should have rewarded maturity
    // ********************************

    let single_neuron = get_neuron_by_id(
        &test_env.pic,
        controller,
        rewards_canister_id,
        &neuron_id_1
    ).unwrap();
    let rewarded_mat_ogy = single_neuron.rewarded_maturity.get(&ogy_token).unwrap();
    assert_eq!(rewarded_mat_ogy, &200_000u64);
}

// if there are no rewards in the reward pool then it should not distribute for that token. other's with rewards should carry on.
#[test]
fn test_distribute_rewards_with_no_rewards() {
    let mut test_env = default_test_setup();

    let ogy_ledger_id = test_env.token_ledgers.get("ogy_ledger_canister_id").unwrap().clone();
    let rewards_canister_id = test_env.rewards_canister_id;
    let neuron_id_1 = test_env.neuron_data.get(&0usize).unwrap().clone().id.unwrap();
    let ogy_token = TokenSymbol::parse("OGY").unwrap();

    let reward_pool = Account {
        owner: rewards_canister_id,
        subaccount: Some(REWARD_POOL_SUB_ACCOUNT),
    };

    // ********************************
    // 1. Remove the entire balance of only the OGY reward pool
    // ********************************

    transfer(
        &mut test_env.pic,
        rewards_canister_id,
        ogy_ledger_id,
        Some(REWARD_POOL_SUB_ACCOUNT),
        Account {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        Nat::from(100_000_000_000u64) - Nat::from(200_000u64)
    ).unwrap();

    let ogy_reward_pool_balance = balance_of(&test_env.pic, ogy_ledger_id, reward_pool);
    assert_eq!(ogy_reward_pool_balance, Nat::from(0u64));

    // ********************************
    // 2. Distribute rewards
    // ********************************
    // TRIGGER - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(2);
    test_env.pic.advance_time(Duration::from_millis(DAY_IN_MS * 1)); //
    tick_n_blocks(&test_env.pic, 10);

    // TRIGGER - distribution
    test_env.pic.advance_time(Duration::from_millis(HOUR_IN_MS * 6)); // 15:00
    tick_n_blocks(&test_env.pic, 20);

    // there should be no historic or active rounds for OGY because it didn't have any rewards to pay out and a neuron should have no rewarded maturity
    let res = get_historic_payment_round(
        &test_env.pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args { token: ogy_token.clone(), round_id: 1 })
    );
    assert_eq!(res.len(), 0);

    let res = get_active_payment_rounds(
        &test_env.pic,
        Principal::anonymous(),
        rewards_canister_id,
        &()
    );
    assert_eq!(res.len(), 0);

    let single_neuron = get_neuron_by_id(
        &test_env.pic,
        Principal::anonymous(),
        rewards_canister_id,
        &neuron_id_1
    ).unwrap();
    let rewarded_mat_ogy = single_neuron.rewarded_maturity.get(&ogy_token);

    assert_eq!(rewarded_mat_ogy, None);

    // ********************************
    // 3. Distribute rewards - week 3 - there should be rewards to distribute now
    // ********************************
    setup_reward_pools(
        &mut test_env.pic,
        &test_env.sns_gov_canister_id,
        &rewards_canister_id,
        &test_env.token_ledgers.values().cloned().collect(),
        100_000_000_000u64
    );

    // Trigger - neuron vote & Maturity sync
    test_env.simulate_neuron_voting(3);
    test_env.pic.advance_time(Duration::from_millis(HOUR_IN_MS * 18)); // 9am
    tick_n_blocks(&test_env.pic, 30);

    // TRIGGER - distribution
    test_env.pic.advance_time(Duration::from_millis(HOUR_IN_MS * 6 + DAY_IN_MS * 6)); // 3pm
    tick_n_blocks(&test_env.pic, 30);

    // test historic rounds - note, payment round id's always go up by 1 if any rewards from any token are distributed so we get ("OGY".to_string(), 2)
    let res = get_historic_payment_round(
        &test_env.pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args { token: ogy_token.clone(), round_id: 1 })
    );
    assert_eq!(res.len(), 1);

    let single_neuron = get_neuron_by_id(
        &test_env.pic,
        Principal::anonymous(),
        rewards_canister_id,
        &neuron_id_1
    ).unwrap();
    let rewarded_mat_ogy = single_neuron.rewarded_maturity.get(&ogy_token).unwrap();
    assert_eq!(rewarded_mat_ogy, &200_000u64);
}

// if 1 reward pool doesn't have enough rewards it should be skipped
#[test]
fn test_distribute_rewards_with_not_enough_rewards() {
    let mut test_env = default_test_setup();

    let ogy_ledger_id = test_env.token_ledgers.get("ogy_ledger_canister_id").unwrap().clone();
    let rewards_canister_id = test_env.rewards_canister_id;

    let ogy_token = TokenSymbol::parse("OGY").unwrap();

    // ********************************
    // 1. Give OGY reward pool balance less than the total in fees
    // ********************************
    let reward_pool = Account {
        owner: rewards_canister_id,
        subaccount: Some(REWARD_POOL_SUB_ACCOUNT),
    };
    // calculate the minimum balance
    let minimum_reward_pool_required =
        200_000u64 * (test_env.neuron_data.len() as u64) + 200_000u64;
    let bad_starting_reward_amount = minimum_reward_pool_required - 200_000;
    // transfer from reward pool to some random id
    transfer(
        &mut test_env.pic,
        rewards_canister_id,
        ogy_ledger_id,
        Some(REWARD_POOL_SUB_ACCOUNT),
        Account {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        Nat::from(100_000_000_000u64) - Nat::from(200_000u64) - bad_starting_reward_amount
    ).unwrap();

    let ogy_reward_pool_balance = balance_of(&test_env.pic, ogy_ledger_id, reward_pool);
    assert_eq!(ogy_reward_pool_balance, Nat::from(bad_starting_reward_amount));

    // ********************************
    // 2. Distribute rewards
    // ********************************

    // increase maturity maturity
    test_env.simulate_neuron_voting(2);

    // TRIGGER - synchronize_neurons
    test_env.pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&test_env.pic, 100);

    // TRIGGER - distribute_rewards
    test_env.pic.advance_time(Duration::from_millis(DAY_IN_MS * 6));
    tick_n_blocks(&test_env.pic, 100);
    test_env.pic.advance_time(Duration::from_secs(60 * 5));
    tick_n_blocks(&test_env.pic, 100);

    // there should be no historic payment round for OGY
    let res = get_historic_payment_round(
        &test_env.pic,
        Principal::anonymous(),
        rewards_canister_id,
        &(get_historic_payment_round::Args { token: ogy_token, round_id: 1 })
    );
    assert_eq!(res.len(), 0);
}
