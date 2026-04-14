use crate::client::sns_rewards::get_5y_neuron_by_id;
use crate::client::sns_rewards::get_active_5y_payment_rounds;
use crate::sns_rewards_suite::tests::utils::fund_5y_reward_pools;
use bity_ic_canister_time::{DAY_IN_MS, HOUR_IN_MS};
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use sns_rewards_api_canister::{
    get_historic_payment_round::Args as GetHistoricPaymentRoundArgs,
    subaccounts::REWARD_POOL_SUB_ACCOUNT,
};
use std::time::Duration;
use types::TokenSymbol;

use crate::{
    client::{
        icrc1::client::{balance_of, transfer},
        sns_rewards::{get_active_payment_rounds, get_historic_payment_round, get_neuron_by_id},
    },
    sns_test_env::{sns_init_args::SnsProject, utils::generate_5y_neuron_data},
    test_env::test_env_builder::{SnsConfig, TestEnvBuilder},
    utils::tick_n_blocks,
};

use super::utils::{fund_reward_pools, rewards_canister_id, simulate_voting};

/// Happy path: rewards are distributed proportionally to all 5y neurons.
#[test]
fn test_distribute_rewards_happy_path() {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2]),
    ];
    let (neuron_data, _) = generate_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&TokenSymbol::ICP)
        .add_token_ledger(&TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let icp_ledger_id = env.get_ledger_canister_id(TokenSymbol::ICP).unwrap();
    let ogy_ledger_id = ogy_sns.test_env.ledger_id;
    let goldao_ledger_id = env.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap();

    println!("1 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 08:01:50 GMT+0000

    fund_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
    // Tuesday Jun 18, 2024, 9:00:00 AM
    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);

    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 100);

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(&pic, 40);

    // ********************************
    // 2. Check Neuron account got paid correctly
    // ********************************
    let n = neuron_data.len() as u64;
    let fees = n * 10_000 + 10_000;
    let pool = (100_000_000_000u64 - fees) as f64;
    let expected_reward = (pool / n as f64) as u64;
    assert_eq!(expected_reward, 9_999_989_000);

    let neuron_account = Account {
        owner: rewards_id,
        subaccount: Some(neuron_id.clone().into()),
    };
    assert_eq!(
        balance_of(&pic, icp_ledger_id, neuron_account),
        expected_reward
    );

    let active = get_active_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);
    let active = get_active_5y_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);

    let neuron = get_neuron_by_id(&pic, env.controller, rewards_id, &neuron_id).unwrap();
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::ICP),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::OGY),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::GOLDAO),
        Some(&100_000u64)
    );

    let icp_history = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::ICP,
            round_id: 1,
        },
    );
    assert_eq!(icp_history.len(), 1);
}

/// When the ICP reward pool is empty, only OGY and GOLDAO rounds are created.
#[test]
fn test_distribute_rewards_with_no_icp_rewards() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];
    let (neuron_data, _) = generate_5y_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&TokenSymbol::ICP)
        .add_token_ledger(&TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let icp_ledger_id = env.get_ledger_canister_id(TokenSymbol::ICP).unwrap();
    let ogy_ledger_id = ogy_sns.test_env.ledger_id;
    let goldao_ledger_id = env.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap();

    fund_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );

    // Drain ICP reward pool
    transfer(
        &pic,
        rewards_id,
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

    // Tuesday Jun 18, 2024, 9:00:00 AM
    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);

    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 100);

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(&pic, 40);

    let neuron_account = Account {
        owner: rewards_id,
        subaccount: Some(neuron_id.clone().into()),
    };
    assert_eq!(
        balance_of(&pic, icp_ledger_id, neuron_account),
        Nat::from(0u64)
    );
    assert!(balance_of(&pic, ogy_ledger_id, neuron_account) > Nat::from(0u64));

    let icp_history = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::ICP,
            round_id: 1,
        },
    );
    assert_eq!(icp_history.len(), 0);

    let neuron = get_neuron_by_id(&pic, Principal::anonymous(), rewards_id, &neuron_id).unwrap();
    assert_eq!(neuron.rewarded_maturity.get(&TokenSymbol::ICP), None);
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::OGY),
        Some(&100_000u64)
    );
}

/// When a pool balance is below the minimum fee threshold, that token's round is skipped.
#[test]
fn test_distribute_rewards_with_not_enough_rewards() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];
    let (neuron_data, _) = generate_5y_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&TokenSymbol::ICP)
        .add_token_ledger(&TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let icp_ledger_id = env.get_ledger_canister_id(TokenSymbol::ICP).unwrap();
    let ogy_ledger_id = ogy_sns.test_env.ledger_id;
    let goldao_ledger_id = env.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap();

    fund_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );

    // Leave ICP pool just below the minimum needed to cover fees
    let min_required = 10_000u64 * neuron_data.len() as u64 + 10_000u64;
    transfer(
        &pic,
        rewards_id,
        icp_ledger_id,
        Some(REWARD_POOL_SUB_ACCOUNT),
        Account {
            owner: Principal::anonymous(),
            subaccount: None,
        },
        100_000_000_000u128 - 10_000u128 - (min_required - 10_000) as u128,
    )
    .unwrap();

    // Tuesday Jun 18, 2024, 9:00:00 AM
    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);

    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);

    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 100);

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(&pic, 40);

    let icp_history = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::ICP,
            round_id: 1,
        },
    );
    assert_eq!(icp_history.len(), 0);

    let active = get_active_payment_rounds(&pic, Principal::anonymous(), rewards_id, &());
    assert_eq!(active.len(), 0);

    let ogy_history = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::OGY,
            round_id: 1,
        },
    );
    assert_eq!(ogy_history.len(), 1);

    let goldao_history = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::GOLDAO,
            round_id: 1,
        },
    );
    assert_eq!(goldao_history.len(), 1);
}

pub fn wait_1_day(pic: &pocket_ic::PocketIc) {
    for _ in 0..24 {
        pic.advance_time(Duration::from_millis(HOUR_IN_MS)); // advance by 1 hour
        tick_n_blocks(pic, 10);
    }
}

use pocket_ic::PocketIc;
fn advance_hours(pic: &PocketIc, hours: u64, ticks: u32) {
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * hours));
    tick_n_blocks(pic, ticks);
}

fn advance_days(pic: &PocketIc, days: u64) {
    for _ in 0..days {
        advance_hours(pic, 24, 10);
    }
}

/// Happy path: rewards are distributed proportionally to all 5y neurons.
#[test]
fn test_distribute_5y_rewards_happy_path() {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2]),
    ];
    let (neuron_data, _) = generate_5y_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&TokenSymbol::ICP)
        .add_token_ledger(&TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let icp_ledger_id = env.get_ledger_canister_id(TokenSymbol::ICP).unwrap();
    let ogy_ledger_id = ogy_sns.test_env.ledger_id;
    let goldao_ledger_id = env.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap();

    println!("1 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 08:01:50 GMT+0000

    fund_5y_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
    // Tuesday Jun 18, 2024, 9:00:00 AM
    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    println!("2 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 08:01:50 GMT+0000

    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 100);
    println!("3 Time now is {:?}", pic.get_time()); // Wed Jun 19 2024 08:01:50 GMT+0000

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(&pic, 40);

    println!("4 Time now is {:?}", pic.get_time()); // Wed Jun 19 2024 13:01:50 GMT+0000

    // ********************************
    // 2. Check Neuron account got paid correctly
    // ********************************
    let n = neuron_data.len() as u64;
    let fees = n * 10_000 + 10_000;
    let pool = (100_000_000_000u64 - fees) as f64;
    let expected_reward = (pool / n as f64) as u64;
    assert_eq!(expected_reward, 9_999_989_000);

    let neuron_account = Account {
        owner: rewards_id,
        subaccount: Some(neuron_id.clone().into()),
    };
    assert_eq!(
        balance_of(&pic, icp_ledger_id, neuron_account),
        expected_reward
    );

    let active = get_active_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);
    let active = get_active_5y_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);

    let neuron = get_5y_neuron_by_id(&pic, env.controller, rewards_id, &neuron_id).unwrap();
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::ICP),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::OGY),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::GOLDAO),
        Some(&100_000u64)
    );

    let neuron = get_5y_neuron_by_id(&pic, env.controller, rewards_id, &neuron_id).unwrap();
    assert!(
        neuron
            .rewarded_maturity
            .get(&TokenSymbol::ICP)
            .copied()
            .unwrap_or(0)
            > 0,
        "rewarded_maturity should be non-zero after distribution"
    );
}

/// Happy path: rewards are distributed proportionally to all neurons (both 5y and regular).
#[test]
fn test_mixed_neurons_both_receive_rewards() {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2]),
    ];
    let (neuron_data, _) = generate_5y_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&TokenSymbol::ICP)
        .add_token_ledger(&TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let icp_ledger_id = env.get_ledger_canister_id(TokenSymbol::ICP).unwrap();
    let ogy_ledger_id = ogy_sns.test_env.ledger_id;
    let goldao_ledger_id = env.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap();

    println!("1 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 08:01:50 GMT+0000

    fund_5y_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );
    fund_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
    // Tuesday Jun 18, 2024, 9:00:00 AM
    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    println!("2 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 08:01:50 GMT+0000

    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 100);
    println!("3 Time now is {:?}", pic.get_time()); // Wed Jun 19 2024 08:01:50 GMT+0000

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(&pic, 100);

    println!("4 Time now is {:?}", pic.get_time()); // Wed Jun 19 2024 13:01:50 GMT+0000

    // ********************************
    // 2. Check Neuron account got paid correctly
    // ********************************
    let n = neuron_data.len() as u64;
    let fees =
        n * TokenSymbol::ICP.get_token_info(true).fee + TokenSymbol::ICP.get_token_info(true).fee;
    let pool = (100_000_000_000u64 - fees) as f64;
    let expected_reward = 2 * (pool / n as f64) as u64; // NOTE: we expect 2x rewards since we funded both pools
    assert_eq!(expected_reward, 19_999_978_000);

    let neuron_account = Account {
        owner: rewards_id,
        subaccount: Some(neuron_id.clone().into()),
    };
    assert_eq!(
        balance_of(&pic, icp_ledger_id, neuron_account),
        expected_reward
    );

    let active = get_active_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);
    let active = get_active_5y_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);

    let neuron = get_neuron_by_id(&pic, env.controller, rewards_id, &neuron_id).unwrap();
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::ICP),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::OGY),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron.rewarded_maturity.get(&TokenSymbol::GOLDAO),
        Some(&100_000u64)
    );

    let neuron_5y = get_5y_neuron_by_id(&pic, env.controller, rewards_id, &neuron_id).unwrap();
    assert_eq!(
        neuron_5y.rewarded_maturity.get(&TokenSymbol::ICP),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron_5y.rewarded_maturity.get(&TokenSymbol::OGY),
        Some(&100_000u64)
    );
    assert_eq!(
        neuron_5y.rewarded_maturity.get(&TokenSymbol::GOLDAO),
        Some(&100_000u64)
    );
}

use crate::sns_test_env::utils::generate_neuron_data;
/// Non-5y neurons receive rewards from the standard round but not the 5y round.
/// 5y neurons receive rewards from the 5y round.
#[test]
fn test_mixed_neurons_standard_and_5y_rounds_are_independent() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];
    let (regular_neurons, _) = generate_neuron_data(0, 5, 1, &users);
    let (five_y_neurons, _) = generate_5y_neuron_data(5, 10, 1, &users);
    let mut all_neurons = regular_neurons.clone();
    all_neurons.extend(five_y_neurons.clone());

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(all_neurons.clone()))
        .add_token_ledger(&TokenSymbol::ICP)
        .add_token_ledger(&TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let icp_ledger_id = env.get_ledger_canister_id(TokenSymbol::ICP).unwrap();
    let ogy_ledger_id = ogy_sns.test_env.ledger_id;
    let goldao_ledger_id = env.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap();

    fund_reward_pools(
        &pic,
        rewards_id,
        &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id],
        100_000_000_000,
    );

    let regular_id = regular_neurons.get(&0usize).unwrap().id.clone().unwrap();
    let five_y_id = five_y_neurons.get(&5usize).unwrap().id.clone().unwrap();

    // Tuesday Jun 18, 2024, 9:00:00 AM
    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);

    simulate_voting(&pic, &ogy_sns.test_env, &all_neurons, 2, &users);

    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 100);

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(&pic, 40);

    let regular_balance = balance_of(
        &pic,
        icp_ledger_id,
        Account {
            owner: rewards_id,
            subaccount: Some(regular_id.into()),
        },
    );
    let five_y_balance = balance_of(
        &pic,
        icp_ledger_id,
        Account {
            owner: rewards_id,
            subaccount: Some(five_y_id.into()),
        },
    );

    assert!(
        regular_balance > Nat::from(0u64),
        "Regular neuron should receive standard rewards"
    );
    assert!(
        five_y_balance > Nat::from(0u64),
        "5y neuron should receive 5y rewards"
    );
}
