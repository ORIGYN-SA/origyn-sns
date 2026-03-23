use candid::Nat;
use candid::{CandidType, Deserialize};
use icrc_ledger_types::icrc1::account::Account;
use serde::Serialize;
use sns_governance_canister::types::NeuronId;
use std::time::Duration;

use crate::{
    client::icrc1::client::{balance_of, transfer},
    sns_neuron_controller_suite::setup::test_setup_with_predefined_sns_neurons,
    utils::tick_n_blocks,
};

#[test]
fn test_process_ogy_neurons_happy_path() {
    let test_env = test_setup_with_predefined_sns_neurons();

    let ogy_ledger_canister_id = test_env.ogy_sns_test_env.ledger_id;
    let ogy_rewards_canister_id = test_env.ogy_rewards_canister_id;

    let initial_sns_rewards_balance = balance_of(
        &mut test_env.get_pic(),
        ogy_ledger_canister_id,
        Account {
            owner: test_env.rewards_destination,
            subaccount: None,
        },
    );
    println!(
        "initial_sns_rewards_balance: {:?}",
        initial_sns_rewards_balance
    );

    let sns_neuron_controller_id = test_env.sns_neuron_controller_id;

    let neuron = test_env.ogy_neuron_data.get(&0usize).unwrap().clone();
    let neuron_id = neuron.id.unwrap();

    assert!(neuron.permissions.get(0).unwrap().principal == Some(sns_neuron_controller_id)); // double check the data correct (sns_neuron_controller_id's hotkey is on the first neuron's permissions list)

    let neuron_account = Account {
        owner: ogy_rewards_canister_id,
        subaccount: Some(neuron_id.clone().into()),
    };

    // Transfer "rewards" to the neuron
    transfer(
        &test_env.get_pic(),
        test_env.ogy_sns_test_env.governance_id,
        ogy_ledger_canister_id,
        None,
        neuron_account,
        300_000_000_000_000_u64,
    )
    .unwrap();
    println!("neuron_account: {:?} {:?}", neuron_account.owner.to_text(), neuron_account.subaccount);

    let initial_neuron_rewards_balance = balance_of(
        &mut test_env.get_pic(),
        ogy_ledger_canister_id,
        neuron_account,
    );
    println!(
        "initial_neuron_rewards_balance: {:?}",
        initial_neuron_rewards_balance
    );

    test_env
        .get_pic()
        .advance_time(Duration::from_secs(24 * 60 * 60));
    tick_n_blocks(&test_env.get_pic(), 10);

    let current_sns_rewards_balance = balance_of(
        &mut test_env.get_pic(),
        ogy_ledger_canister_id,
        Account {
            owner: test_env.rewards_destination,
            subaccount: None,
        },
    );
    println!(
        "current_sns_rewards_balance: {:?}",
        current_sns_rewards_balance
    );

    let current_neuron_rewards_balance = balance_of(
        &mut test_env.get_pic(),
        ogy_ledger_canister_id,
        neuron_account,
    );
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
        initial_neuron_rewards_balance - Nat::from(2u32 * 200_000u32)
    );
}


// 2021-05-06 19:17:25.000000032 UTC: [Canister 7uieb-cx777-77776-qaaaq-cai] Neurons:"lnxxh-yaaaa-aaaaq-aadha-cai" [Neuron { id: Some(NeuronId { id: [175, 85, 112, 245, 161, 129, 11, 122, 247, 140, 175, 75, 199, 10, 102, 15, 13, 245, 30, 66, 186, 249, 29, 77, 229, 178, 50, 141, 224, 232, 61, 252] }), permissions: [NeuronPermission { principal: Some(Principal { len: 10, bytes: [255, 255, 255, 255, 255, 208, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }), permission_type: [1, 2, 3, 4, 5, 6, 7, 8, 9] }], cached_neuron_stake_e8s: 3000000000000, neuron_fees_e8s: 0, created_timestamp_seconds: 1713271942, aging_since_timestamp_seconds: 1713271942, followees: {}, maturity_e8s_equivalent: 100000, voting_power_percentage_multiplier: 1, source_nns_neuron_id: None, staked_maturity_e8s_equivalent: Some(100000), auto_stake_maturity: Some(false), vesting_period_seconds: Some(100000), disburse_maturity_in_progress: [], dissolve_state: Some(WhenDissolvedTimestampSeconds(100000000000)) }]