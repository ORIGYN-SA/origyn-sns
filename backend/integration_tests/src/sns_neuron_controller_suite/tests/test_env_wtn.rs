use crate::sns_test_env::sns_test_env::SnsProject;
use crate::sns_test_env::utils::generate_neuron_data;
use crate::test_env::test_env_builder::SnsConfig;
use crate::test_env::test_env_builder::TestEnvBuilder;
use crate::{
    client::icrc1::client::{balance_of, transfer},
    utils::tick_n_blocks,
};
use candid::Nat;
use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use std::time::Duration;

#[test]
fn test_process_goldao_neurons_happy_path() {
    let (ogy_neuron_data, _) = generate_neuron_data(
        0,
        1,
        1,
        &vec![Principal::from_text("piyk3-liaaa-aaaae-qjvsa-cai").unwrap()],
    );

    let (wtn_neuron_data, _) = generate_neuron_data(
        0,
        1,
        1,
        &vec![Principal::from_text("piyk3-liaaa-aaaae-qjvsa-cai").unwrap()],
    );

    // let test_env = test_setup_with_predefined_sns_neurons();
    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(ogy_neuron_data))
        .add_sns(SnsConfig::new(SnsProject::Wtn).with_neurons(wtn_neuron_data))
        .add_token_ledger(&types::TokenSymbol::GLDT)
        .add_token_ledger(&types::TokenSymbol::ICP)
        .add_token_ledger(&types::TokenSymbol::WTN)
        .build(); //.install_rewards(canister_id, token_ledgers, sns_gov_canister_id);
    let pic = env.pic.borrow();
    let wtn_ledger_canister_id = env
        .get_ledger_canister_id(types::TokenSymbol::WTN)
        .unwrap();

    let rewards_destination = Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    let sns_neuron_controller_id = env.install_sns_neuron_controller(
        Principal::from_text("piyk3-liaaa-aaaae-qjvsa-cai").unwrap(),
        Some(rewards_destination),
        env.get_sns(SnsProject::Ogy).test_env.governance_id,
        env.get_sns(SnsProject::GoldDao).test_env.governance_id,
        env.get_sns(SnsProject::GoldDao).test_env.ledger_id,
        Principal::anonymous(),
        env.get_sns(SnsProject::Wtn).test_env.governance_id,
        env.get_sns(SnsProject::Wtn).test_env.ledger_id,
        Principal::anonymous(),
        Principal::anonymous(),
    );

    let initial_sns_rewards_balance = balance_of(
        &pic,
        wtn_ledger_canister_id,
        Account {
            owner: rewards_destination,
            subaccount: None,
        },
    );
    println!(
        "initial_sns_rewards_balance: {:?}",
        initial_sns_rewards_balance
    );

    let neuron = env
        .get_sns(SnsProject::Wtn)
        .neuron_data
        .get(&0usize)
        .unwrap()
        .clone();
    let neuron_id = neuron.id.unwrap();

    assert!(neuron.permissions.get(0).unwrap().principal == Some(sns_neuron_controller_id)); // double check the data correct (sns_neuron_controller_id's hotkey is on the first neuron's permissions list)

    let neuron_account = Account {
        owner: env.get_sns(SnsProject::Wtn).test_env.governance_id,
        subaccount: Some(neuron_id.clone().into()),
    };

    // Transfer "rewards" to the neuron
    transfer(
        &pic,
        env.get_sns(SnsProject::Wtn).test_env.governance_id,
        // env.controller,
        wtn_ledger_canister_id,
        None,
        neuron_account,
        300_000_000_000_000_u64,
    )
    .unwrap();
    tick_n_blocks(&pic, 1);

    let initial_neuron_rewards_balance =
        balance_of(&pic, wtn_ledger_canister_id, neuron_account);
    println!(
        "initial_neuron_rewards_balance: {:?}",
        initial_neuron_rewards_balance
    );

    pic.advance_time(Duration::from_secs(24 * 60 * 60));
    tick_n_blocks(&pic, 10);

    let current_sns_rewards_balance = balance_of(
        &pic,
        wtn_ledger_canister_id,
        Account {
            owner: rewards_destination,
            subaccount: None,
        },
    );
    println!(
        "current_sns_rewards_balance: {:?}",
        current_sns_rewards_balance
    );

    let current_neuron_rewards_balance =
        balance_of(&pic, wtn_ledger_canister_id, neuron_account);
    println!(
        "current_neuron_rewards_balance: {:?}",
        current_neuron_rewards_balance
    );

    assert!(initial_sns_rewards_balance < current_sns_rewards_balance);
    assert!(initial_neuron_rewards_balance > current_neuron_rewards_balance);

    // Should be 0 as all were claimed
    assert_eq!(current_neuron_rewards_balance, Nat::from(0u8));
    // Should be the initial balance - 2x fees as two transactions happen in the claiming and distribution process.
    assert_eq!(
        current_sns_rewards_balance,
        initial_neuron_rewards_balance - Nat::from(2u32 * 100_000u32)
    );
}
