use crate::client::pocket::create_canister_with_id;
use crate::wasms::SNS_NEURON_CONTROLLER;
use bity_ic_types::BuildVersion;
use candid::encode_one;
use candid::Principal;
use pocket_ic::PocketIc;
use std::collections::HashMap;
use types::TokenSymbol;

use sns_neuron_controller_api_canister::init::TokenParams;

pub fn setup(
    pic: &PocketIc,
    canister_id: Principal,
    controllers: Vec<Principal>,
    ogy_sns_governance_canister_id: Principal,
    goldao_sns_governance_canister_id: Principal,
    goldao_sns_ledger_canister_id: Principal,
    goldao_sns_rewards_canister_id: Principal,
    reward_tokens: HashMap<TokenSymbol, TokenParams>,
) -> Principal {
    let controller = controllers.first().unwrap();
    let canister_id = create_canister_with_id(pic, *controller, canister_id);

    let wasm = SNS_NEURON_CONTROLLER.clone();
    pic.add_cycles(canister_id, 1_000_000_000_000_000);

    let cloned_controllers = controllers.clone();
    pic.set_controllers(canister_id, Some(controller.clone()), cloned_controllers)
        .unwrap();
    pic.tick();

    let snc_init_args = sns_neuron_controller_api_canister::Args::Init(
        sns_neuron_controller_api_canister::init::InitArgs {
            test_mode: false,
            version: BuildVersion::min(),
            commit_hash: "integration_testing".to_string(),
            authorized_principals: vec![*controller, ogy_sns_governance_canister_id],
            goldao_manager_config: sns_neuron_controller_api_canister::init::GoldaoManagerConfig {
                goldao_sns_governance_canister_id,
                goldao_sns_ledger_canister_id,
                goldao_sns_rewards_canister_id,
                reward_tokens,
            },
        },
    );

    pic.install_canister(
        canister_id,
        wasm,
        encode_one(snc_init_args).unwrap(),
        Some(controller.clone()),
    );

    canister_id
}
