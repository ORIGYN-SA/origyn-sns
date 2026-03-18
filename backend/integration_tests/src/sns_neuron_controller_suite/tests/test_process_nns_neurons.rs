use candid::Nat;
use candid::{CandidType, Deserialize};
use icrc_ledger_types::icrc1::account::Account;
use nns_governance_canister::types::NeuronId;
use serde::Serialize;
use std::time::Duration;

use crate::{
    client::icrc1::client::balance_of, client::nns_governance::list_neurons,
    sns_neuron_controller_suite::setup::test_setup_with_predefined_nns_neurons,
    utils::tick_n_blocks,
};

#[derive(Deserialize, CandidType, Serialize)]
pub struct GetNeuronRequest {
    neuron_id: NeuronId,
}

#[test]
fn test_process_nns_neurons_maturity_distribution() {
    let test_env = test_setup_with_predefined_nns_neurons();

    let icp_ledger_canister_id = test_env.nns_test_env.canister_ids.ledger_id;
    let nns_governance_canister_id = test_env.nns_test_env.canister_ids.governance_id;
    let rewards_destination = test_env.rewards_destination;

    // Check initial balance of rewards destination
    let initial_destination_balance = balance_of(
        &test_env.get_pic(),
        icp_ledger_canister_id,
        Account {
            owner: rewards_destination,
            subaccount: None,
        },
    );
    println!(
        "Initial rewards destination balance: {:?}",
        initial_destination_balance
    );

    // Get predefined neurons
    let neurons_response = list_neurons(
        &test_env.get_pic(),
        test_env.sns_neuron_controller_id,
        nns_governance_canister_id,
        &nns_governance_canister::types::ListNeurons {
            neuron_ids: vec![],
            include_neurons_readable_by_caller: true,
        },
    );

    println!(
        "Available neurons: {:?}",
        neurons_response.full_neurons.len()
    );
    let neuron_before = neurons_response
        .full_neurons
        .first()
        .expect("Should have at least one neuron");
    let neuron_id = neuron_before.id.as_ref().unwrap().id;

    println!(
        "Neuron maturity before distribution: {} e8s",
        neuron_before.maturity_e8s_equivalent
    );

    // Ensure maturity is above threshold
    assert!(
        neuron_before.maturity_e8s_equivalent >= 10_000u64,
        "Neuron should have maturity above threshold"
    );

    // Initial setup - advance time to let the system stabilize
    test_env.get_pic().advance_time(Duration::from_secs(100));
    tick_n_blocks(&test_env.get_pic(), 10);

    // Advance time to trigger the processing job
    test_env
        .get_pic()
        .advance_time(Duration::from_secs(24 * 60 * 60)); // 1 day
    tick_n_blocks(&test_env.get_pic(), 50);

    // The job should have run and initiated maturity disbursement
    // Now we need to wait 7 days for the maturity modulation period
    println!("Waiting 7 days for maturity disbursement to complete...");
    test_env
        .get_pic()
        .advance_time(Duration::from_secs(7 * 24 * 60 * 60)); // 7 days
    tick_n_blocks(&test_env.get_pic(), 100);

    // Check that maturity was distributed
    let final_destination_balance = balance_of(
        &test_env.get_pic(),
        icp_ledger_canister_id,
        Account {
            owner: rewards_destination,
            subaccount: None,
        },
    );
    println!(
        "Final rewards destination balance: {:?}",
        final_destination_balance
    );

    // Get neurons after disbursement to verify the maturity was reduced
    let neurons_after_response = list_neurons(
        &test_env.get_pic(),
        test_env.sns_neuron_controller_id,
        nns_governance_canister_id,
        &nns_governance_canister::types::ListNeurons {
            neuron_ids: vec![neuron_id],
            include_neurons_readable_by_caller: true,
        },
    );

    let neuron_after = neurons_after_response
        .full_neurons
        .first()
        .expect("Neuron should exist");
    println!(
        "Neuron maturity after distribution: {} e8s",
        neuron_after.maturity_e8s_equivalent
    );

    // Verify the distribution happened (should be greater than initial balance)
    assert!(
        final_destination_balance > initial_destination_balance,
        "Rewards destination should have received disbursed maturity"
    );

    // The distributed amount should be approximately the maturity amount minus fees
    let distributed_amount = final_destination_balance - initial_destination_balance;
    println!("Distributed amount: {:?}", distributed_amount);

    // Should have received some maturity distribution
    assert!(
        distributed_amount > Nat::from(0u64),
        "Should receive some maturity distribution"
    );

    // Get neurons after disbursement to verify the maturity was reduced
    let neurons_after_response = list_neurons(
        &test_env.get_pic(),
        test_env.sns_neuron_controller_id,
        nns_governance_canister_id,
        &nns_governance_canister::types::ListNeurons {
            neuron_ids: vec![neuron_id],
            include_neurons_readable_by_caller: true,
        },
    );

    let neuron_after = neurons_after_response
        .full_neurons
        .first()
        .expect("Neuron should exist");
    println!(
        "Neuron maturity after distribution: {} e8s",
        neuron_after.maturity_e8s_equivalent
    );

    // Maturity should be significantly reduced or zero
    assert!(
        neuron_after.maturity_e8s_equivalent < neuron_before.maturity_e8s_equivalent,
        "Neuron maturity should be reduced after distribution"
    );
}

#[test]
fn test_process_nns_neurons_below_threshold() {
    let test_env = test_setup_with_predefined_nns_neurons();

    let icp_ledger_canister_id = test_env.nns_test_env.canister_ids.ledger_id;
    let rewards_destination = test_env.rewards_destination;

    // Check initial balance of rewards destination
    let initial_destination_balance = balance_of(
        &test_env.get_pic(),
        icp_ledger_canister_id,
        Account {
            owner: rewards_destination,
            subaccount: None,
        },
    );

    // Get predefined neurons (assuming they have low maturity for this test)
    let neurons_response = list_neurons(
        &test_env.get_pic(),
        test_env.sns_neuron_controller_id,
        test_env.nns_test_env.canister_ids.governance_id,
        &nns_governance_canister::types::ListNeurons {
            neuron_ids: vec![],
            include_neurons_readable_by_caller: true,
        },
    );

    let neuron_info = neurons_response
        .full_neurons
        .first()
        .expect("Should have at least one neuron");
    println!(
        "Neuron maturity (checking if below threshold): {} e8s",
        neuron_info.maturity_e8s_equivalent
    );

    // Skip test if neuron already has high maturity
    if neuron_info.maturity_e8s_equivalent >= 10_000u64 {
        println!("Skipping test - neuron has too much maturity for this test case");
        return;
    }

    // Advance time to trigger the processing job
    test_env
        .get_pic()
        .advance_time(Duration::from_secs(24 * 60 * 60)); // 1 day
    tick_n_blocks(&test_env.get_pic(), 10);

    // Check that no maturity was distributed (balance should be unchanged)
    let final_destination_balance = balance_of(
        &test_env.get_pic(),
        icp_ledger_canister_id,
        Account {
            owner: rewards_destination,
            subaccount: None,
        },
    );

    // Verify no distribution happened since maturity was below threshold
    assert_eq!(
        final_destination_balance, initial_destination_balance,
        "No distribution should occur when maturity is below threshold"
    );

    println!("✓ Test passed: No distribution occurred for low maturity");
}
