use crate::client::pocket::create_canister_with_id;
use crate::client::pocket::install_canister;
use crate::wasms;
use candid::Principal;
use canister_jobs_api::init::InitArgs as DailyJobsInitArgs;
use pocket_ic::PocketIc;
use utils::consts::E8S_PER_OGY;

pub fn setup(
    pic: &PocketIc,
    controller: Principal,
    canister_jobs_id: Principal,
    ogy_ledger_canister_id: Principal,
) -> Principal {
    let canister_id = create_canister_with_id(pic, controller, canister_jobs_id);
    pic.add_cycles(canister_id, 20_000_000_000_000);

    let wasm = wasms::CANISTER_JOBS.clone();

    let canister_jobs_init_args = DailyJobsInitArgs {
        test_mode: true,
        authorized_principals: vec![controller],
        ledger_canister_id: ogy_ledger_canister_id,
        burn_principal_id: controller,
        daily_burn_amount: 1_000_000 * E8S_PER_OGY,
    };

    install_canister(pic, controller, canister_id, wasm, canister_jobs_init_args);

    canister_id
}
