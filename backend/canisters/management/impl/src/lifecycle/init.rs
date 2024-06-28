use ic_cdk_macros::init;
use management_api_canister::init::InitArgs;
use tracing::info;
use utils::env::CanisterEnv;

use crate::state::{ Data, RuntimeState };

use super::init_canister;

#[init]
fn init(args: InitArgs) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let data = Data::new(false, args.authorized_principals, args.governance_principals);

    let runtime_state = RuntimeState::new(env, data);

    init_canister(runtime_state);

    info!("Init complete.")
}
