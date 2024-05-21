use std::{ env, path::Path };
use candid::{Nat, Principal};
use icrc_ledger_canister::init::{ ArchiveOptions as ArchiveOptionsIcrc, InitArgs, LedgerArgument };
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::PocketIc;
use super_stats_v3_api::init_and_upgrade::InitArgs as SuperStatsInitArgs;
use utils::consts::E8S_FEE_OGY;

use crate::{
    client::pocket::{ create_canister, install_canister },
    utils::random_principal,
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
    let ogy_new_ledger_canister_id = create_canister(pic, controller);
    let ogy_super_stats_canister_id = create_canister(pic, controller);

    let ogy_new_ledger_canister_wasm = wasms::IC_ICRC1_LEDGER.clone();
    let ogy_super_stats_canister_wasm = wasms::SUPER_STATS_V3.clone();

    let ogy_new_ledger_init_args = LedgerArgument::Init(InitArgs {
        minting_account: Account::from(controller),
        initial_balances: Vec::new(),
        transfer_fee: Nat::from(0u64),
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

    let ogy_super_stats_init_args = SuperStatsInitArgs {
        admin: Account::from(controller).to_string(),
        test_mode: true,
    };

    install_canister(
        pic,
        controller,
        ogy_super_stats_canister_id,
        ogy_super_stats_canister_wasm,
        ogy_super_stats_init_args
    );

    CanisterIds {
        ogy_new_ledger: ogy_new_ledger_canister_id,
        ogy_super_stats: ogy_super_stats_canister_id,
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
