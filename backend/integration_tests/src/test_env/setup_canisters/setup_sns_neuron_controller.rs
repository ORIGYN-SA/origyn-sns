use crate::client::pocket::create_canister_with_id;
use crate::wasms::SNS_NEURON_CONTROLLER;
use bity_ic_types::BuildVersion;
use candid::encode_one;
use candid::Nat;
use candid::Principal;
use pocket_ic::PocketIc;

pub fn setup(
    pic: &PocketIc,
    cansiter_id: Principal,
    controllers: Vec<Principal>,
    rewards_destination: Option<Principal>,
    ogy_sns_governance_canister_id: Principal,
    ogy_sns_ledger_canister_id: Principal,
    ogy_sns_rewards_canister_id: Principal,
    goldao_sns_governance_canister_id: Principal,
    goldao_sns_ledger_canister_id: Principal,
    goldao_sns_rewards_canister_id: Principal,
) -> Principal {
    let controller = controllers.first().unwrap();
    let cansiter_id = create_canister_with_id(pic, *controller, cansiter_id);

    let wasm = SNS_NEURON_CONTROLLER.clone();
    pic.add_cycles(cansiter_id, 1_000_000_000_000_000);

    let cloned_controllers = controllers.clone();
    pic.set_controllers(cansiter_id, Some(controller.clone()), cloned_controllers)
        .unwrap();
    pic.tick();

    let snc_init_args = sns_neuron_controller_api_canister::Args::Init(
        sns_neuron_controller_api_canister::init::InitArgs {
            test_mode: true,
            version: BuildVersion::min(),
            commit_hash: "integration_testing".to_string(),
            authorized_principals: vec![*controller, ogy_sns_governance_canister_id],
            rewards_destination,
            ogy_manager_config: sns_neuron_controller_api_canister::init::OgyManagerConfig {
                ogy_sns_governance_canister_id,
                ogy_sns_ledger_canister_id,
                ogy_sns_rewards_canister_id,
                ogy_rewards_threshold: Nat::from(100_000_000_000_000_u64),
            },
            goldao_manager_config: sns_neuron_controller_api_canister::init::GoldaoManagerConfig {
                goldao_sns_governance_canister_id,
                goldao_sns_ledger_canister_id,
                goldao_sns_rewards_canister_id,
                goldao_rewards_threshold: Nat::from(3_000_000_000_000_u64),
            },
            icp_manager_config: sns_neuron_controller_api_canister::init::IcpManagerConfig {
                nns_governance_canister_id: Principal::anonymous(),
                nns_ledger_canister_id: Principal::anonymous(),
                icp_rewards_threshold: Nat::from(10_000_u64),
            },
        },
    );

    pic.install_canister(
        cansiter_id,
        wasm,
        encode_one(snc_init_args).unwrap(),
        Some(controller.clone()),
    );

    cansiter_id
}
