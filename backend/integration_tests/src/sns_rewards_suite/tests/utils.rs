use bity_ic_canister_time::{DAY_IN_MS, HOUR_IN_MS};
use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::PocketIc;
use sns_governance_canister::types::Neuron;
use sns_rewards_api_canister::subaccounts::REWARD_POOL_SUB_ACCOUNT;
use std::collections::HashMap;
use std::time::Duration;
use types::TokenSymbol;

use crate::{
    client::{self, icrc1::client::transfer},
    sns_test_env::sns_test_env::SnsTestEnv,
    utils::tick_n_blocks,
};

/// Fixed canister ID used for the rewards canister across all sns_rewards tests.
pub fn rewards_canister_id() -> Principal {
    Principal::from_text("yuijc-oiaaa-aaaap-ahezq-cai").unwrap()
}

/// Mint `amount` tokens into the reward pool sub-account of `rewards_id` for each ledger.
/// The minting account is resolved by matching the ledger ID against known hardcoded prod IDs.
pub fn fund_reward_pools(
    pic: &PocketIc,
    rewards_id: Principal,
    ledger_ids: &[Principal],
    amount: u64,
) {
    let reward_account = Account {
        owner: rewards_id,
        subaccount: Some(REWARD_POOL_SUB_ACCOUNT),
    };
    for &ledger_id in ledger_ids {
        let minting_account =
            client::icrc1::icrc1_minting_account(pic, Principal::anonymous(), ledger_id, &())
                .unwrap();
        transfer(
            pic,
            minting_account.owner,
            ledger_id,
            None,
            reward_account,
            amount,
        )
        .unwrap();
    }
}

use sns_rewards_api_canister::subaccounts::REWARD_POOL_SUB_ACCOUNT_5Y;
pub fn fund_5y_reward_pools(
    pic: &PocketIc,
    rewards_id: Principal,
    ledger_ids: &[Principal],
    amount: u64,
) {
    let reward_account = Account {
        owner: rewards_id,
        subaccount: Some(REWARD_POOL_SUB_ACCOUNT_5Y),
    };
    for &ledger_id in ledger_ids {
        let minting_account =
            client::icrc1::icrc1_minting_account(pic, Principal::anonymous(), ledger_id, &())
                .unwrap();
        transfer(
            pic,
            minting_account.owner,
            ledger_id,
            None,
            reward_account,
            amount,
        )
        .unwrap();
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
