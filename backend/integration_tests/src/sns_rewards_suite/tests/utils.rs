use bity_ic_canister_time::{DAY_IN_MS, HOUR_IN_MS};
use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::PocketIc;
use sns_governance_canister::types::Neuron;
use sns_rewards_api_canister::subaccounts::REWARD_POOL_SUB_ACCOUNT;
use std::collections::HashMap;
use std::time::Duration;

use crate::{
    client::icrc1::client::transfer,
    sns_test_env::sns_test_env::SnsTestEnv,
    utils::tick_n_blocks,
};

/// Fixed canister ID used for the rewards canister across all sns_rewards tests.
pub fn rewards_canister_id() -> Principal {
    Principal::from_text("yuijc-oiaaa-aaaap-ahezq-cai").unwrap()
}

/// Advance time to the next 9 AM daily sync window.
pub fn advance_to_sync(pic: &PocketIc) {
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 3));
    tick_n_blocks(pic, 20);
}

/// Advance time through a full sync + distribution cycle (9 AM sync → 2 PM distribute).
pub fn advance_to_distribution(pic: &PocketIc) {
    pic.advance_time(Duration::from_millis(DAY_IN_MS));
    tick_n_blocks(pic, 20);
    pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
    tick_n_blocks(pic, 40);
}

/// Mint `amount` tokens into the reward pool sub-account of `rewards_id` for each ledger.
pub fn fund_reward_pools(
    pic: &PocketIc,
    minting_account: Principal,
    rewards_id: Principal,
    ledger_ids: &[Principal],
    amount: u64,
) {
    let reward_account = Account {
        owner: rewards_id,
        subaccount: Some(REWARD_POOL_SUB_ACCOUNT),
    };
    for &ledger_id in ledger_ids {
        transfer(pic, minting_account, ledger_id, None, reward_account, amount).unwrap();
    }
}

/// Reinstall governance with scaled maturity to simulate neurons voting.
/// Preserves the original neuron structure (dissolve state, permissions, etc.).
pub fn simulate_voting(
    pic: &PocketIc,
    sns: &SnsTestEnv,
    neuron_data: &HashMap<usize, Neuron>,
    multiplier: u64,
    users: &[Principal],
) {
    let scaled: HashMap<usize, Neuron> = neuron_data
        .iter()
        .map(|(&idx, n)| {
            let mut neuron = n.clone();
            neuron.maturity_e8s_equivalent = 100_000 * multiplier;
            (idx, neuron)
        })
        .collect();
    pic.tick();
    sns.reinstall_governance_with_neuron_data(&scaled);
    pic.tick();
}
