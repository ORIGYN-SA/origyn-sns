use std::{ thread, time::Duration };

use candid::{ Nat, Principal };
use icrc_ledger_types::icrc1::account::Account;
use token_metrics_api::init::InitArgs as TokenMetricsInitArgs;
use super_stats_v3_api::init_and_upgrade::InitArgs as SuperStatsInitArgs;

use crate::{
    client::pocket::{ create_canister, install_canister },
    setup::{ SnsWithRewardsTestEnv, SnsWithRewardsTestEnvBuilder },
    wasms,
};

pub fn default_test_setup() -> DefaultSetupEnv {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2])
    ];

    // Init the sns, with ledger & governance canisters
    let mut sns_with_rewards_test_env = SnsWithRewardsTestEnvBuilder::new()
        .add_random_neurons(10)
        .add_token_ledger("OGY", &mut vec![], Nat::from(200_000u64))
        .with_reward_pools(Nat::from(100_000_000_000u64))
        .add_users(users)
        .build();

    // Extract the pocket-ic instance and the canisters controller
    let pic = &mut sns_with_rewards_test_env.pic;
    let controller = sns_with_rewards_test_env.controller;
    let ogy_ledger_id = sns_with_rewards_test_env.token_ledgers
        .get("ogy_ledger_canister_id")
        .unwrap()
        .clone();

    // Create super stats canister
    let super_stats_canister_id = create_canister(pic, controller);
    let super_stats_canister_wasm = wasms::SUPER_STATS_V3.clone();

    let super_stats_init_args = SuperStatsInitArgs {
        admin: Account::from(controller).to_string(),
        test_mode: true,
    };

    install_canister(
        pic,
        controller,
        super_stats_canister_id,
        super_stats_canister_wasm,
        super_stats_init_args
    );

    // Create token metrics canister
    let token_metrics_canister_id = create_canister(pic, controller);
    let token_metrics_canister_wasm = wasms::TOKEN_METRICS.clone();
    let token_metrics_canister_init_args = TokenMetricsInitArgs {
        test_mode: true,
        treasury_account: "".to_string(),
        foundation_accounts: Vec::new(),
        sns_governance_canister_id: sns_with_rewards_test_env.sns_gov_canister_id,
        sns_rewards_canister_id: sns_with_rewards_test_env.rewards_canister_id,
        super_stats_canister_id,
        ogy_new_ledger_canister_id: ogy_ledger_id,
    };

    install_canister(
        pic,
        controller,
        token_metrics_canister_id,
        token_metrics_canister_wasm,
        token_metrics_canister_init_args
    );

    // Sleep 5 seconds for the initial jobs of token_metrics
    thread::sleep(Duration::from_secs(5));

    DefaultSetupEnv {
        sns_with_rewards_test_env,
        token_metrics_canister_id,
    }
}

pub struct DefaultSetupEnv {
    pub sns_with_rewards_test_env: SnsWithRewardsTestEnv,
    pub token_metrics_canister_id: Principal,
}
