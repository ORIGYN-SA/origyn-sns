use std::{ env, path::Path };
use candid::{ Nat, Principal };
use icrc_ledger_canister::init::{ ArchiveOptions as ArchiveOptionsIcrc, InitArgs, LedgerArgument };
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::PocketIc;
use daily_jobs_api::init::InitArgs as DailyJobsInitArgs;
use utils::consts::E8S_PER_OGY;

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
    /*
     *****************************
     ** Install Ledger Canister **
     *****************************
     */
    let ogy_ledger_canister_id = create_canister(pic, controller);
    let ogy_ledger_canister_wasm = wasms::IC_ICRC1_LEDGER.clone();
    let ogy_ledger_init_args = LedgerArgument::Init(InitArgs {
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
        ogy_ledger_canister_id,
        ogy_ledger_canister_wasm,
        ogy_ledger_init_args
    );

    /*
     *********************************
     ** Install Daily Jobs Canister **
     *********************************
     */
    let daily_jobs_canister_id = create_canister(pic, controller);
    let daily_jobs_canister_wasm = wasms::DAILY_JOBS.clone();
    let daily_jobs_init_args = DailyJobsInitArgs {
        test_mode: true,
        ledger_canister_id: ogy_ledger_canister_id,
        burn_principal_id: controller,
        daily_burn_amount: 1_000_000 * E8S_PER_OGY,
    };

    install_canister(
        pic,
        controller,
        daily_jobs_canister_id,
        daily_jobs_canister_wasm,
        daily_jobs_init_args
    );

    CanisterIds {
        ogy_ledger_canister_id,
        daily_jobs_canister_id,
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
