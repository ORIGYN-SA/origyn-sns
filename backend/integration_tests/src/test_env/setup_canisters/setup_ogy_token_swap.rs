use crate::client::pocket::create_canister_with_id;
use crate::client::pocket::install_canister;
use crate::wasms;
use candid::Principal;
use pocket_ic::PocketIc;

pub fn setup(
    pic: &PocketIc,
    controller: Principal,
    canister_id: Principal,
    ogy_legacy_ledger_canister_id: Principal,
    ogy_new_ledger_canister_id: Principal,
    ogy_legacy_minting_account_principal: Principal,
) -> Principal {
    let canister_id = create_canister_with_id(pic, controller, canister_id);
    pic.add_cycles(canister_id, 20_000_000_000_000);

    let wasm = wasms::OGY_TOKEN_SWAP.clone();

    let ogy_token_swap_init_args =
        ogy_token_swap_api::lifecycle::Args::Init(ogy_token_swap_api::lifecycle::init::InitArgs {
            test_mode: true,
            version: bity_ic_types::BuildVersion::default(),
            commit_hash: "commit_hash".to_string(),
            ogy_legacy_ledger_canister_id,
            ogy_new_ledger_canister_id,
            ogy_legacy_minting_account_principal,
            authorized_principals: vec![controller],
        });

    install_canister(pic, controller, canister_id, wasm, ogy_token_swap_init_args);

    canister_id
}
