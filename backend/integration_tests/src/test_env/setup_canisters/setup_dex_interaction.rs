use crate::client::pocket::create_canister_with_id;
use crate::wasms::BUYBACK_BURN;
use candid::encode_one;
use candid::Principal;
use pocket_ic::PocketIc;

pub fn setup(
    pic: &mut PocketIc,
    canister_id: Principal,
    args: dex_interaction_api::Args,
    controller: Principal,
) -> Principal {
    let canister_id = create_canister_with_id(pic, controller, canister_id);

    let wasm = BUYBACK_BURN.clone();
    pic.add_cycles(canister_id, 1_000_000_000_000_000);

    pic.set_controllers(
        canister_id,
        Some(controller.clone()),
        vec![controller.clone()],
    )
    .unwrap();
    pic.tick();

    pic.install_canister(
        canister_id,
        wasm,
        encode_one(args).unwrap(),
        Some(controller.clone()),
    );

    canister_id
}

use bity_ic_types::BuildVersion;
use dex_interaction_api::post_upgrade::UpgradeArgs;
use dex_interaction_api::Args;
use pocket_ic::RejectResponse;
pub fn upgrade_dex_interaction_canister(
    pic: &PocketIc,
    canister_id: Principal,
    controller: &Principal,
) -> std::result::Result<(), RejectResponse> {
    let dex_interaction_wasm = crate::wasms::BUYBACK_BURN.clone();

    let upgrade_args = Args::Upgrade(UpgradeArgs {
        version: BuildVersion::min(),
        commit_hash: "Test".to_string(),
    });

    let encoded_args = encode_one(upgrade_args).expect("Failed to encode upgrade args");

    pic.upgrade_canister(
        canister_id,
        dex_interaction_wasm,
        encoded_args,
        Some(controller.clone()),
    )
}
