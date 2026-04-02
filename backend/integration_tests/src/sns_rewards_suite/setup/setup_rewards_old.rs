use std::collections::HashMap;

use crate::wasms;
use bity_ic_types::BuildVersion;
use candid::CandidType;
use candid::{encode_one, Principal};
use pocket_ic::PocketIc;
use serde::Deserialize;

#[derive(Deserialize, CandidType)]
pub struct InitArgs {
    pub test_mode: bool,
    pub sns_ledger_canister_id: Principal,
    pub sns_gov_canister_id: Principal,
}

pub fn setup_old_rewards_canister(
    pic: &PocketIc,
    sns_rewards_id: Principal,
    token_ledgers: &HashMap<String, Principal>,
    sns_canister_id: Principal,
    controller: &Principal,
) -> Principal {
    let rewards_wasm = wasms::SNS_REWARDS_OLD.clone();
    pic.add_cycles(sns_rewards_id, 100_000_000_000_000_000);
    pic.set_controllers(
        sns_rewards_id,
        Some(controller.clone()),
        vec![controller.clone(), sns_canister_id],
    )
    .unwrap();
    pic.tick();

    let sns_ledger_canister_id = token_ledgers
        .get("goldao_ledger_canister_id")
        .expect("couldn't find ledger with 'goldao_ledger_canister_id'")
        .clone();

    let init_args = InitArgs {
        test_mode: true,
        sns_ledger_canister_id,
        sns_gov_canister_id: sns_canister_id.clone(),
    };
    let _ = pic
        .reinstall_canister(
            sns_rewards_id,
            rewards_wasm,
            encode_one(init_args).unwrap(),
            Some(controller.clone()),
        )
        .unwrap();
    sns_rewards_id
}
