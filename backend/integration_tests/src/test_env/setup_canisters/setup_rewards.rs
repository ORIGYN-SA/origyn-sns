use crate::client::pocket::create_canister_with_id;
use bity_ic_types::BuildVersion;
use candid::{encode_one, Principal};
use pocket_ic::PocketIc;
use sns_rewards_api_canister::init::InitArgs;
use sns_rewards_api_canister::Args;

use crate::wasms;

pub fn setup(
    pic: &PocketIc,
    canister_id: Principal,
    sns_ledger_canister_id: Principal,
    sns_canister_id: Principal,
    controller: &Principal,
) -> Principal {
    let canister_id = create_canister_with_id(pic, *controller, canister_id);

    let wasm = wasms::REWARDS.clone();

    pic.add_cycles(canister_id, 100_000_000_000_000_000);
    pic.set_controllers(
        canister_id,
        Some(controller.clone()),
        vec![controller.clone()],
    )
    .unwrap();
    pic.tick();

    let init_args = Args::Init(InitArgs {
        test_mode: true,
        version: BuildVersion::min(),
        commit_hash: "Test".to_string(),
        sns_ledger_canister_id,
        sns_gov_canister_id: sns_canister_id.clone(),
    });
    pic.install_canister(
        canister_id,
        wasm,
        encode_one(init_args).unwrap(),
        Some(controller.clone()),
    );
    canister_id
}

use candid::CandidType;
use serde::Deserialize;
use serde::Serialize;
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GoldInitArgs {
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub icp_ledger_canister_id: Principal,
    pub sns_ledger_canister_id: Principal,
    pub ogy_ledger_canister_id: Principal,
    pub sns_gov_canister_id: Principal,
}

use canister_jobs_api::post_upgrade::UpgradeArgs;
#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum GoldArgs {
    Init(GoldInitArgs),
    Upgrade(UpgradeArgs),
}

pub fn setup_goldao(
    pic: &PocketIc,
    canister_id: Principal,
    icp_ledger_canister_id: Principal,
    sns_ledger_canister_id: Principal,
    ogy_ledger_canister_id: Principal,
    sns_canister_id: Principal,
    controller: &Principal,
) -> Principal {
    let canister_id = create_canister_with_id(pic, *controller, canister_id);

    let wasm = wasms::GOLD_REWARDS.clone();

    pic.add_cycles(canister_id, 100_000_000_000_000_000);
    pic.set_controllers(
        canister_id,
        Some(controller.clone()),
        vec![controller.clone()],
    )
    .unwrap();
    pic.tick();

    let init_args = GoldArgs::Init(GoldInitArgs {
        test_mode: true,
        version: BuildVersion::min(),
        commit_hash: "Test".to_string(),
        icp_ledger_canister_id,
        sns_ledger_canister_id,
        ogy_ledger_canister_id,
        sns_gov_canister_id: sns_canister_id.clone(),
    });
    pic.install_canister(
        canister_id,
        wasm,
        encode_one(init_args).unwrap(),
        Some(controller.clone()),
    );
    canister_id
}
