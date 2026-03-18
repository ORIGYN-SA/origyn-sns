use bity_ic_types::BuildVersion;
pub use canister_jobs_api::init::InitArgs;
use ic_cdk_macros::init;
use tracing::info;
use utils::env::CanisterEnv;

use crate::state::{Data, RuntimeState};

use super::init_canister;

#[init]
fn init(args: InitArgs) {
    bity_ic_canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode, BuildVersion::default(), "".to_string());
    let data = Data::new(
        args.ledger_canister_id,
        args.burn_principal_id,
        args.daily_burn_amount,
        args.authorized_principals,
    );

    let runtime_state = RuntimeState::new(env.clone(), data);

    init_canister(runtime_state);

    info!("Init complete.")
}
