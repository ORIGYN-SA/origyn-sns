use ic_cdk_macros::init;
pub use daily_jobs_api::init::InitArgs;
use tracing::info;
use utils::env::CanisterEnv;

use crate::state::{ Data, RuntimeState };

use super::init_canister;

#[init]
fn init(args: InitArgs) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let data = Data::new(args.ledger_canister_id, args.burn_principal_id, args.daily_burn_amount);

    let runtime_state = RuntimeState::new(env.clone(), data);

    init_canister(runtime_state);

    info!("Init complete.")
}
