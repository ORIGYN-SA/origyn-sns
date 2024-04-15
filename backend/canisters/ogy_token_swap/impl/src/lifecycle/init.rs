use candid::CandidType;
use ic_cdk_macros::init;
use serde::Deserialize;
use tracing::info;
use types::CanisterId;
use utils::env::CanisterEnv;

use crate::state::{ Data, RuntimeState };

use super::init_canister;

#[derive(Deserialize, CandidType)]
pub struct Args {
    pub test_mode: bool,
    pub ogy_legacy_ledger_canister_id: CanisterId,
    pub ogy_new_ledger_canister_id: CanisterId,
}

#[init]
fn init(args: Args) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let data = Data::new(args.ogy_new_ledger_canister_id, args.ogy_legacy_ledger_canister_id);

    let runtime_state = RuntimeState::new(env.clone(), data);

    init_canister(runtime_state);

    info!("Init complete.")
}
