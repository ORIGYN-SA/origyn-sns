use ic_cdk_macros::init;
pub use ogy_token_swap_api::init::InitArgs;
use tracing::info;
use utils::env::CanisterEnv;

use crate::state::{ Data, RuntimeState };

use super::init_canister;

#[init]
fn init(args: InitArgs) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let data = Data::new(
        args.ogy_new_ledger_canister_id,
        args.ogy_legacy_ledger_canister_id,
        args.ogy_legacy_minting_account_principal
    );

    let runtime_state = RuntimeState::new(env.clone(), data);

    init_canister(runtime_state);

    info!("Init complete.")
}
