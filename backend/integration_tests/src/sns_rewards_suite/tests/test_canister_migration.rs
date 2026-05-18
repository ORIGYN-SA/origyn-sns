use crate::sns_rewards_suite::setup::setup_rewards::upgrade_rewards_canister;
use crate::sns_rewards_suite::setup::setup_rewards_old::setup_old_rewards_canister;
use crate::{sns_rewards_suite::setup::default_test_setup, utils::tick_n_blocks};
use bity_ic_canister_time::{DAY_IN_MS, HOUR_IN_MS};
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use std::time::Duration;
use types::{TokenSymbol, TokenSymbolV0};

use super::utils::{fund_reward_pools, rewards_canister_id, simulate_voting};
use crate::sns_test_env::utils::generate_neuron_data;
use crate::{
    client::{
        icrc1::client::{balance_of},
        sns_rewards::{get_active_payment_rounds},
    },
    sns_test_env::{sns_init_args::SnsProject},
    test_env::test_env_builder::{SnsConfig, TestEnvBuilder},
};

#[test]
fn test_migration_happy_path() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();
    let sns_rewards_id = test_env.rewards_canister_id;
    setup_old_rewards_canister(
        &pic,
        sns_rewards_id,
        TokenSymbol::OGY.ledger_id(false),
        test_env.sns_gov_canister_id,
        &test_env.controller,
    );
    tick_n_blocks(&pic, 100);

    let status = pic.canister_status(sns_rewards_id, Some(test_env.sns_gov_canister_id));
    println!("Canister status before migration: {:?}", status);

    upgrade_rewards_canister(&pic, sns_rewards_id, &test_env.sns_gov_canister_id).unwrap();
    tick_n_blocks(&pic, 20);

    tick_n_blocks(&pic, 20);

    let status = pic.canister_status(sns_rewards_id, Some(test_env.sns_gov_canister_id));
    println!("Canister status after migration: {:?}", status);
}

#[test]
fn test_migration_with_popelated_data() {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2]),
    ];
    let (neuron_data, _) = generate_neuron_data(0, 10, 1, &users);

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(neuron_data.clone()))
        .build();

    let pic = env.pic.borrow();
    let ogy_sns = env.get_sns(SnsProject::Ogy);
    let rewards_id = env.install_rewards(rewards_canister_id(), ogy_sns.test_env.governance_id);

    let ogy_ledger_id = env.get_ledger_canister_id(TokenSymbol::OGY).unwrap();

    tick_n_blocks(&pic, 100);

    setup_old_rewards_canister(
        &pic,
        rewards_id,
        TokenSymbol::OGY.ledger_id(false),
        env.get_sns(SnsProject::Ogy).test_env.governance_id,
        &env.controller,
    );

    for i in 1..10 {
        println!("1 Time now is {:?}", pic.get_time()); //Tue Jun 18 2024 08:01:46 GMT+0000

        fund_reward_pools(&pic, rewards_id, &[ogy_ledger_id], 100_000_000_000);

        let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();
        // Tuesday Jun 18, 2024, 9:00:00 AM
        pic.advance_time(Duration::from_millis(HOUR_IN_MS));
        tick_n_blocks(&pic, 10);
        println!("2 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 09:01:46 GMT+0000
        simulate_voting(&pic, &ogy_sns.test_env, &neuron_data, i * 2, &users);
        println!("3 Time now is {:?}", pic.get_time()); // Tue Jun 18 2024 09:01:46 GMT+0000

        pic.advance_time(Duration::from_millis(DAY_IN_MS));
        tick_n_blocks(&pic, 100);
        println!("4 Time now is {:?}", pic.get_time()); // Wed Jun 19 2024 09:01:46 GMT+0000

        pic.advance_time(Duration::from_millis(HOUR_IN_MS * 5)); // → 14:00
        tick_n_blocks(&pic, 40);
        println!("5 Time now is {:?}", pic.get_time()); // 	Wed Jun 19 2024 14:01:46 GMT+0000
    }

    // // ********************************
    // // 2. Check Neuron account got paid correctly
    // // ********************************
    let neuron_id = neuron_data.get(&0usize).unwrap().id.clone().unwrap();

    let n = neuron_data.len() as u64;
    let fees = n * 200_000 + 200_000;
    let pool = (100_000_000_000u64 - fees) as f64;
    let expected_reward = (pool / n as f64) as u64;
    assert_eq!(expected_reward, 9999780000);

    let neuron_account = Account {
        owner: rewards_id,
        subaccount: Some(neuron_id.clone().into()),
    };
    assert!(balance_of(&pic, ogy_ledger_id, neuron_account) > 0_u64);

    let active = get_active_payment_rounds(&pic, env.controller, rewards_id, &());
    assert_eq!(active.len(), 0);


    let p: GetHistoricPaymentRoundResponseV0 = execute_update(
        &pic,
        Principal::anonymous(),
        rewards_id,
        "get_historic_payment_round",
        &GetHistoricPaymentRoundArgsV0 {
            token: TokenSymbolV0("OGY".to_string()),
            round_id: 1,
        },
    );
    println!("OGY History: {:?}", p);
    assert_eq!(p.len(), 1);

    upgrade_rewards_canister(&pic, rewards_id, &ogy_sns.test_env.governance_id).unwrap();
    tick_n_blocks(&pic, 20);

    tick_n_blocks(&pic, 20);

    let status = pic.canister_status(rewards_id, Some(ogy_sns.test_env.governance_id));
    println!("Canister status after migration: {:?}", status);
}

use crate::client::pocket::execute_update;
use candid::CandidType;
use serde::Deserialize;
use serde::Serialize;
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetHistoricPaymentRoundArgsV0 {
    pub token: TokenSymbolV0,
    pub round_id: u16,
}

use sns_governance_canister::types::NeuronId;
use sns_rewards_api_canister::payment_round::Payment;
use std::collections::BTreeMap;
use types::TimestampMillis;
pub type GetHistoricPaymentRoundResponseV0 = Vec<(u16, PaymentRound)>;
#[derive(Serialize, Deserialize, CandidType, Debug, Clone)]
pub struct PaymentRound {
    pub id: u16, // id of the round. must start at 1 and will go to 65,535 before cycling to 1. Can't be 0 because 0 is the id of the reward pool accounts
    pub round_funds_total: Nat, // total amount to be distributed from the funds sub account
    pub tokens_to_distribute: Nat,
    pub fees: Nat,            // total fees required for all valid transactions
    pub ledger_id: Principal, // the ledger associated with transferring funds for this round of specific token payments
    pub token: TokenSymbolV0, // the token associated with a specific payment round
    pub date_initialized: TimestampMillis, //
    pub total_neuron_maturity: u64, // total maturity of all neurons for this specific period
    pub payments: BTreeMap<NeuronId, Payment>, // map of payments to process
    pub retries: u8,
}
