use std::collections::HashMap;

use candid::{ encode_one, CandidType, Principal };
use pocket_ic::PocketIc;
use serde::Deserialize;
use sns_rewards_api_canister::init::InitArgs;

use crate::wasms;

pub fn setup_rewards_canister(
    pic: &mut PocketIc,
    token_ledgers: &HashMap<String, Principal>,
    sns_canister_id: &Principal,
    controller: &Principal
) -> Principal {
    let sns_subnet = pic.topology().get_sns().unwrap();
    let rewards_canister = pic.create_canister_on_subnet(
        Some(controller.clone()),
        None,
        sns_subnet
    );

    let rewards_wasm = wasms::REWARDS.clone();
    pic.add_cycles(rewards_canister, 100_000_000_000_000_000);
    pic.set_controllers(
        rewards_canister,
        Some(controller.clone()),
        vec![controller.clone()]
    ).unwrap();
    pic.tick();

    let sns_ledger_canister_id = token_ledgers
        .get("ogy_ledger_canister_id")
        .expect("couldn't find ledger with 'ogy_ledger_canister_id'")
        .clone();

    let init_args = InitArgs {
        test_mode: true,
        sns_ledger_canister_id,
        sns_gov_canister_id: sns_canister_id.clone(),
    };
    pic.install_canister(
        rewards_canister,
        rewards_wasm,
        encode_one(init_args).unwrap(),
        Some(controller.clone())
    );
    rewards_canister
}
