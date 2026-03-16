use super::init_canister;
use crate::state::{Data, RuntimeState};
use ic_cdk::init;
pub use ogy_token_swap_api::Args;
use std::collections::HashSet;
use tracing::info;
use utils::env::CanisterEnv;

#[init]
fn init(args: Args) {
    match args {
        Args::Init(init_args) => {
            bity_ic_canister_logger::init(init_args.test_mode);

            let env = CanisterEnv::new(
                init_args.test_mode,
                init_args.version,
                init_args.commit_hash,
            );
            let data = Data::new(
                init_args.ogy_new_ledger_canister_id,
                init_args.ogy_legacy_ledger_canister_id,
                init_args.ogy_legacy_minting_account_principal,
                init_args.authorized_principals,
                HashSet::new(),
            );

            let runtime_state = RuntimeState::new(env.clone(), data);

            init_canister(runtime_state);

            info!("Init complete.")
        }
        Args::Upgrade(_) => {
            panic!(
                "Cannot initialize the canister with an Upgrade argument. Please provide an Init argument."
            );
        }
    }
}
