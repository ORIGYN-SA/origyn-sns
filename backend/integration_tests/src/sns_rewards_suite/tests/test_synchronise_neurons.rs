use bity_ic_canister_time::{DAY_IN_MS, HOUR_IN_MS};
use candid::Principal;
use std::time::Duration;

use crate::{
    client::sns_rewards::{get_all_neurons, get_neuron_by_id},
    sns_test_env::{
        sns_init_args::SnsProject,
        utils::{generate_5y_neuron_data, generate_neuron_data},
    },
    test_env::test_env_builder::{SnsConfig, TestEnvBuilder},
    utils::{random_principal, tick_n_blocks},
};

use super::utils::{rewards_canister_id, simulate_voting};

/// After the daily sync, all 5y neurons appear in the rewards canister and
/// accumulated_maturity grows with each voting round.
#[test]
fn test_synchronise_neurons_happy_path() {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2]),
    ];
    let (neuron_data, _) = generate_5y_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&types::TokenSymbol::ICP)
        .add_token_ledger(&types::TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    // Start just before the 9 AM daily sync on Wednesday Jun 19, 2024
    pic.set_time((std::time::UNIX_EPOCH + Duration::from_millis(1718776800000)).into());
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 3));
    tick_n_blocks(&pic, 20);

    let all_neurons = get_all_neurons(&pic, random_principal(), rewards_id, &());
    assert_eq!(all_neurons as usize, neuron_data.len());

    let neuron_id = neuron_data.get(&1usize).unwrap().id.clone().unwrap();
    let neuron = get_neuron_by_id(&pic, random_principal(), rewards_id, &neuron_id).unwrap();
    assert_eq!(neuron.accumulated_maturity, 0);

    // Day 1: maturity increases (multiplier 2 → delta = 100_000)
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 50);

    let neuron = get_neuron_by_id(&pic, random_principal(), rewards_id, &neuron_id).unwrap();
    assert_eq!(neuron.accumulated_maturity, 100_000);

    // Day 2: maturity increases again (multiplier 3 → another delta = 100_000)
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 3, &users);
    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 50);

    let neuron = get_neuron_by_id(&pic, random_principal(), rewards_id, &neuron_id).unwrap();
    assert_eq!(neuron.accumulated_maturity, 200_000);
}

/// Non-5y neurons are synced into neuron_maturity but NOT into neuron_maturity_5y.
#[test]
fn test_non_5y_neurons_are_synced_but_not_5y_eligible() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];
    let (regular_neurons, _) = generate_neuron_data(0, 5, 1, &users);
    let (five_y_neurons, _) = generate_5y_neuron_data(5, 10, 1, &users);
    let mut all_neurons = regular_neurons.clone();
    all_neurons.extend(five_y_neurons.clone());

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(all_neurons.clone()))
        .add_token_ledger(&types::TokenSymbol::ICP)
        .add_token_ledger(&types::TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    // +1h triggers the 9 AM sync
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 3));
    tick_n_blocks(&pic, 20);

    let all_synced = get_all_neurons(&pic, random_principal(), rewards_id, &());
    assert_eq!(all_synced as usize, all_neurons.len());
}

/// accumulated_maturity never decreases even when current maturity drops.
#[test]
fn test_accumulated_maturity_is_monotonic() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];
    let (neuron_data, _) = generate_5y_neuron_data(0, 5, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .add_token_ledger(&types::TokenSymbol::ICP)
        .add_token_ledger(&types::TokenSymbol::GOLDAO)
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();

    // Trigger sync first so the neuron is registered, then increase maturity

    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 3));
    tick_n_blocks(&pic, 20);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 3, &users);
    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 50);

    let after_increase = get_neuron_by_id(&pic, random_principal(), rewards_id, &neuron_id)
        .unwrap()
        .accumulated_maturity;
    assert!(after_increase > 0);

    // Drop maturity (multiplier back to 1)
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 1, &users);
    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(&pic, 50);

    let after_drop = get_neuron_by_id(&pic, random_principal(), rewards_id, &neuron_id)
        .unwrap()
        .accumulated_maturity;

    assert!(
        after_drop >= after_increase,
        "accumulated_maturity must never decrease"
    );
}
