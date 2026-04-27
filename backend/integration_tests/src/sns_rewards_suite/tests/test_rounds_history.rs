use super::utils::{fund_reward_pools, rewards_canister_id, simulate_voting};
use crate::sns_test_env::utils::generate_neuron_data;
use crate::utils::await_with_timeout_sync;
use crate::utils::is_interval_more_than_7_days;
use crate::{
    client::sns_rewards::get_historic_payment_round,
    sns_test_env::sns_init_args::SnsProject,
    test_env::test_env_builder::{SnsConfig, TestEnvBuilder},
    utils::tick_n_blocks,
};
use bity_ic_canister_time::HOUR_IN_MS;
use candid::Principal;
use sns_rewards_api_canister::get_historic_payment_round::Args as GetHistoricPaymentRoundArgs;
use std::time::Duration;
use types::TokenSymbol;

#[test]
fn test_distribute_rewards_adds_to_history_correctly() {
    let users = vec![Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1])];

    let (neuron_data, _) = generate_neuron_data(0, 1, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);

    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let ogy_ledger_id = env.get_ledger_canister_id(TokenSymbol::OGY).unwrap();

    let all_ledgers = vec![ogy_ledger_id];

    // ================================
    // 1. Initial Funding + First Activity
    // ================================
    fund_reward_pools(&pic, rewards_id, &all_ledgers, 100_000_000_000);

    pic.advance_time(Duration::from_millis(HOUR_IN_MS));
    tick_n_blocks(&pic, 10);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 2, &users);

    let distribution_await_seconds = 24 * 60 * 60 + 5 * 60 * 60;
    await_with_timeout_sync(
        &pic,
        distribution_await_seconds - 1000..distribution_await_seconds + 1000,
        |p| {
            // 'p' is the &PocketIc passed by the helper
            get_historic_payment_round(
                p,
                Principal::anonymous(),
                rewards_id,
                &GetHistoricPaymentRoundArgs {
                    token: TokenSymbol::OGY,
                    round_id: 1,
                },
            )
            .len()
        },
        &1usize,
    )
    .unwrap();

    // ================================
    // 2. Second Week Distribution
    // ================================
    fund_reward_pools(&pic, rewards_id, &all_ledgers, 100_000_000_000);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 30, &users);

    let distribution_await_seconds = 7 * 24 * 60 * 60;
    await_with_timeout_sync(
        &pic,
        distribution_await_seconds - 1000..distribution_await_seconds + 1000,
        |p| {
            // 'p' is the &PocketIc passed by the helper
            get_historic_payment_round(
                p,
                Principal::anonymous(),
                rewards_id,
                &GetHistoricPaymentRoundArgs {
                    token: TokenSymbol::OGY,
                    round_id: 2,
                },
            )
            .len()
        },
        &1usize,
    )
    .unwrap();

    println!("Second distribution done at {:?}", pic.get_time());

    // ================================
    // 3. Verify Round History
    // ================================
    let res_1 = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::OGY,
            round_id: 1,
        },
    );
    assert_eq!(res_1.len(), 1, "Round 1 not found");

    let res_2 = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::OGY,
            round_id: 2,
        },
    );

    assert_eq!(res_2.len(), 1, "Round 2 not found");

    let first_dist_time = res_1[0].1.date_initialized;
    let second_dist_time = res_2[0].1.date_initialized;

    assert!(is_interval_more_than_7_days(
        first_dist_time,
        second_dist_time
    ));

    // ================================
    // 4. Third Round (OGY)
    // ================================
    fund_reward_pools(&pic, rewards_id, &all_ledgers, 100_000_000_000);
    simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, 40, &users);

    await_with_timeout_sync(
        &pic,
        distribution_await_seconds - 1000..distribution_await_seconds + 1000,
        |p| {
            // 'p' is the &PocketIc passed by the helper
            get_historic_payment_round(
                p,
                Principal::anonymous(),
                rewards_id,
                &GetHistoricPaymentRoundArgs {
                    token: TokenSymbol::OGY,
                    round_id: 3,
                },
            )
            .len()
        },
        &1usize,
    )
    .unwrap();

    let res_3 = get_historic_payment_round(
        &pic,
        Principal::anonymous(),
        rewards_id,
        &GetHistoricPaymentRoundArgs {
            token: TokenSymbol::OGY,
            round_id: 3,
        },
    );
    let third_dist_time = res_3[0].1.date_initialized;
    assert!(is_interval_more_than_7_days(
        second_dist_time,
        third_dist_time
    ));

    assert_eq!(res_3.len(), 1, "Failed to find OGY Round 3");
}
