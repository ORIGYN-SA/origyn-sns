use crate::state::{Data, RuntimeState};
pub use collection_index_api::Args;
use ic_cdk::init;
use tracing::info;
use utils::env::CanisterEnv;

use super::init_canister;

#[init]
fn init(args: Args) {
    match args {
        Args::Init(init_args) => {
            canister_logger::init(init_args.test_mode);

            let env = CanisterEnv::new(
                init_args.test_mode,
                init_args.version,
                init_args.commit_hash,
            );
            let data = Data::new(init_args.authorized_principals);

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
