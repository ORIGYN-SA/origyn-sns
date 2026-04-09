use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use types::TokenSymbol;

use crate::{
    client::{
        icrc1::client::balance_of,
        rewards::{get_active_payment_rounds, get_historic_payment_round, get_neuron_by_id},
    },
    sns_test_env::{
        sns_init_args::SnsProject,
        utils::{generate_5y_neuron_data, generate_neuron_data},
    },
    test_env::test_env_builder::{SnsConfig, TestEnvBuilder},
    utils::tick_n_blocks,
};

use super::utils::{
    advance_to_distribution, fund_reward_pools, rewards_canister_id, simulate_voting,
};

/// All neurons are 5y → both standard and 5y rounds complete, no active rounds remain.
#[test]
fn test_5y_flow_creates_and_completes_payment_rounds() {
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

    fund_reward_pools(&pic, ogy_sns.test_env.governance_id, rewards_id, &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id], 100_000_000_000);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    advance_to_distribution(&pic);

    let active = get_active_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);

    let icp_history = get_historic_payment_round(&pic, env.controller, rewards_id,
        &sns_rewards_api_canister::get_historic_payment_round::Args {
            token: TokenSymbol::ICP, round_id: 1,
        });
    assert!(icp_history.len() >= 1);
}

/// 5y neurons receive a non-zero ICP balance after distribution.
#[test]
fn test_5y_neurons_receive_rewards() {
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

    fund_reward_pools(&pic, ogy_sns.test_env.governance_id, rewards_id, &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id], 100_000_000_000);

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    advance_to_distribution(&pic);

    let balance = balance_of(&pic, icp_ledger_id,
        Account { owner: rewards_id, subaccount: Some(neuron_id.into()) });
    assert!(balance > Nat::from(0u64));
}

/// Mixed setup: regular neurons get standard rewards, 5y neurons get 5y rewards — independently.
#[test]
fn test_mixed_neurons_both_receive_rewards() {
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

    fund_reward_pools(&pic, ogy_sns.test_env.governance_id, rewards_id, &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id], 100_000_000_000);

    let regular_id = regular_neurons.get(&0usize).unwrap().id.clone().unwrap();
    let five_y_id = five_y_neurons.get(&5usize).unwrap().id.clone().unwrap();

    simulate_voting(&pic, &ogy_sns.test_env, &all_neurons, 2, &users);
    advance_to_distribution(&pic);

    let regular_balance = balance_of(&pic, icp_ledger_id,
        Account { owner: rewards_id, subaccount: Some(regular_id.into()) });
    let five_y_balance = balance_of(&pic, icp_ledger_id,
        Account { owner: rewards_id, subaccount: Some(five_y_id.into()) });

    assert!(regular_balance > Nat::from(0u64), "Regular neuron should receive standard rewards");
    assert!(five_y_balance > Nat::from(0u64), "5y neuron should receive 5y rewards");
}

/// When there are no 5y neurons, the standard rounds still complete normally.
#[test]
fn test_no_5y_neurons_standard_rounds_still_complete() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];
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

    fund_reward_pools(&pic, ogy_sns.test_env.governance_id, rewards_id, &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id], 100_000_000_000);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    advance_to_distribution(&pic);

    let active = get_active_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);

    let icp_history = get_historic_payment_round(&pic, env.controller, rewards_id,
        &sns_rewards_api_canister::get_historic_payment_round::Args {
            token: TokenSymbol::ICP, round_id: 1,
        });
    assert_eq!(icp_history.len(), 1);
}

/// Documents the current behaviour: `update_neuron_rewards` tracks `rewarded_maturity`
/// via the standard `neuron_maturity` map, even for 5y neurons.
#[test]
fn test_5y_neuron_rewarded_maturity_is_tracked() {
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

    fund_reward_pools(&pic, ogy_sns.test_env.governance_id, rewards_id, &[icp_ledger_id, ogy_ledger_id, goldao_ledger_id], 100_000_000_000);

    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);
    advance_to_distribution(&pic);

    let neuron = get_neuron_by_id(&pic, env.controller, rewards_id, &neuron_id).unwrap();
    assert!(
        neuron.rewarded_maturity.get(&TokenSymbol::ICP).copied().unwrap_or(0) > 0,
        "rewarded_maturity should be non-zero after distribution"
    );
}
