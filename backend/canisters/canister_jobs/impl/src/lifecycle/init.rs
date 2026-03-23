use crate::lifecycle::init_canister;
use crate::state::{Data, RuntimeState};
use bity_ic_canister_tracing_macros::trace;
pub use canister_jobs_api::Args;
use ic_cdk_macros::init;
use bity_ic_types::BuildVersion;
use tracing::info;
use utils::env::{CanisterEnv};

#[init]
#[trace]
fn init(args: Args) {
    match args {
        Args::Init(init_args) => {
            bity_ic_canister_logger::init(init_args.test_mode);

            let env = CanisterEnv::new(init_args.test_mode, BuildVersion::default(), "".to_string());
            let data = Data::new(
                init_args.ledger_canister_id,
                init_args.burn_principal_id,
                init_args.daily_burn_amount,
                init_args.authorized_principals,
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
