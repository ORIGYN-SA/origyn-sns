use crate::client::pocket::create_canister_with_id;
use bity_ic_types::BuildVersion;
use candid::{encode_one, Principal};
use pocket_ic::PocketIc;
use sns_rewards_api_canister::init::InitArgs;
use sns_rewards_api_canister::Args;

use crate::wasms;

pub fn setup(
    pic: &PocketIc,
    cansiter_id: Principal,
    icp_ledger_canister_id: Principal,
    sns_ledger_canister_id: Principal,
    ogy_ledger_canister_id: Principal,
    sns_canister_id: Principal,
    controller: &Principal,
) -> Principal {
    let cansiter_id = create_canister_with_id(pic, *controller, cansiter_id);

    let wasm = wasms::REWARDS.clone();

    pic.add_cycles(cansiter_id, 100_000_000_000_000_000);
    pic.set_controllers(
        cansiter_id,
        Some(controller.clone()),
        vec![controller.clone()],
    )
    .unwrap();
    pic.tick();

    let init_args = Args::Init(InitArgs {
        test_mode: true,
        version: BuildVersion::min(),
        commit_hash: "Test".to_string(),
        icp_ledger_canister_id,
        sns_ledger_canister_id,
        ogy_ledger_canister_id,
        sns_gov_canister_id: sns_canister_id.clone(),
    });
    pic.install_canister(
        cansiter_id,
        wasm,
        encode_one(init_args).unwrap(),
        Some(controller.clone()),
    );
    cansiter_id
}
