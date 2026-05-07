use crate::client::pocket::create_canister_with_id;
use crate::wasms::SNS_NEURON_CONTROLLER;
use bity_ic_types::BuildVersion;
use candid::encode_one;
use candid::Nat;
use candid::Principal;
use pocket_ic::PocketIc;
use std::collections::HashMap;
use types::TokenSymbol;

pub fn setup(
    pic: &PocketIc,
    canister_id: Principal,
    controllers: Vec<Principal>,
    rewards_destination: Option<Principal>,
    ogy_sns_governance_canister_id: Principal,
    goldao_sns_governance_canister_id: Principal,
    goldao_sns_ledger_canister_id: Principal,
    goldao_sns_rewards_canister_id: Principal,
    wtn_sns_governance_canister_id: Principal,
    wtn_sns_ledger_canister_id: Principal,
    nns_governance_canister_id: Principal,
    nns_ledger_canister_id: Principal,
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
            test_mode: true,
            version: BuildVersion::min(),
            commit_hash: "integration_testing".to_string(),
            authorized_principals: vec![*controller, ogy_sns_governance_canister_id],
            goldao_manager_config: sns_neuron_controller_api_canister::init::GoldaoManagerConfig {
                goldao_sns_governance_canister_id,
                goldao_sns_ledger_canister_id,
                goldao_sns_rewards_canister_id,
                goldao_rewards_threshold: Nat::from(3_000_000_000_000_u64),
                reward_tokens: {
                    let dest = rewards_destination.unwrap_or(canister_id);
                    let mut map = HashMap::new();
                    map.insert(TokenSymbol::ICP, dest);
                    map.insert(TokenSymbol::WTN, dest);
                    map.insert(TokenSymbol::OGY, dest);
                    map
                },
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
