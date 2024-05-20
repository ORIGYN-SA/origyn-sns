use std::{ env, path::Path };

use candid::Principal;
use ic_ledger_types::Tokens;
use icrc_ledger_canister::init::{ ArchiveOptions as ArchiveOptionsIcrc, InitArgs, LedgerArgument };
use icrc_ledger_types::icrc1::account::Account;
use ledger_utils::principal_to_legacy_account_id;
use ogy_legacy_ledger_canister::{ ArchiveOptions as ArchiveOptionsLeg, Duration };
use pocket_ic::PocketIc;

use crate::{
    client::pocket::{ create_canister, install_canister },
    utils::{ random_principal, E8S_FEE_OGY },
    wasms,
};

use super::{ CanisterIds, TestEnv };

pub static POCKET_IC_BIN: &str = "./pocket-ic";

pub fn init() -> TestEnv {
    validate_pocketic_installation();

    let mut pic = PocketIc::new();

    let controller = random_principal();
    let canister_ids = install_canisters(&mut pic, controller);
    TestEnv {
        pic,
        canister_ids,
        controller,
    }
}

fn install_canisters(pic: &mut PocketIc, controller: Principal) -> CanisterIds {
    let ogy_token_swap_canister_id = create_canister(pic, controller);
    let ogy_legacy_ledger_canister_id = create_canister(pic, controller);
    let ogy_new_ledger_canister_id = create_canister(pic, controller);

    let ogy_token_swap_canister_wasm = wasms::OGY_TOKEN_SWAP.clone();
    let ogy_legacy_ledger_canister_wasm = wasms::OGY_LEGACY_LEDGER.clone();
    let ogy_new_ledger_canister_wasm = wasms::IC_ICRC1_LEDGER.clone();

    let ogy_legacy_minting_account_principal = controller;

    let ogy_token_swap_init_args = ogy_token_swap_api::lifecycle::init::InitArgs {
        test_mode: true,
        ogy_legacy_ledger_canister_id,
        ogy_new_ledger_canister_id,
        ogy_legacy_minting_account_principal,
        authorized_principals: vec![controller],
    };
    install_canister(
        pic,
        controller,
        ogy_token_swap_canister_id,
        ogy_token_swap_canister_wasm,
        ogy_token_swap_init_args
    );

    let ogy_legacy_ledger_init_args = ogy_legacy_ledger_canister::init::InitArgs {
        minting_account: principal_to_legacy_account_id(
            ogy_legacy_minting_account_principal,
            None
        ).to_string(),
        initial_values: vec![],
        max_message_size_bytes: None,
        transaction_window: Some(Duration {
            secs: 600,
            nanos: 0,
        }),
        archive_options: Some(ArchiveOptionsLeg {
            trigger_threshold: 2000,
            num_blocks_to_archive: 1000,
            node_max_memory_size_bytes: None,
            max_message_size_bytes: None,
            controller_id: Principal::anonymous(),
        }),
        standard_whitelist: vec![],
        transfer_fee: Some(Tokens::from_e8s(E8S_FEE_OGY)),
        admin: Principal::anonymous(),
        send_whitelist: vec![],
        token_symbol: Some("OGY".to_string()),
        token_name: Some("Origyn".to_string()),
    };
    install_canister(
        pic,
        controller,
        ogy_legacy_ledger_canister_id,
        ogy_legacy_ledger_canister_wasm,
        ogy_legacy_ledger_init_args
    );

    let ogy_new_ledger_init_args = LedgerArgument::Init(InitArgs {
        minting_account: Account::from(controller),
        initial_balances: Vec::new(),
        transfer_fee: E8S_FEE_OGY.into(),
        token_name: "Origyn".into(),
        token_symbol: "OGY".into(),
        metadata: Vec::new(),
        archive_options: ArchiveOptionsIcrc {
            trigger_threshold: 1000,
            num_blocks_to_archive: 1000,
            controller_id: controller,
        },
    });
    install_canister(
        pic,
        controller,
        ogy_new_ledger_canister_id,
        ogy_new_ledger_canister_wasm,
        ogy_new_ledger_init_args
    );

    CanisterIds {
        ogy_swap: ogy_token_swap_canister_id,
        ogy_legacy_ledger: ogy_legacy_ledger_canister_id,
        ogy_new_ledger: ogy_new_ledger_canister_id,
    }
}

pub fn validate_pocketic_installation() {
    let path = POCKET_IC_BIN;

    if !Path::new(&path).exists() {
        println!(
            "
        Could not find the PocketIC binary to run canister integration tests.

        I looked for it at {:?}. You can specify another path with the environment variable POCKET_IC_BIN (note that I run from {:?}).
        ",
            &path,
            &env
                ::current_dir()
                .map(|x| x.display().to_string())
                .unwrap_or_else(|_| "an unknown directory".to_string())
        );
    }
}
