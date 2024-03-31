use candid::CandidType;
use ic_cdk_macros::init;
use serde::Deserialize;
use tracing::info;
use types::{TokenInfo, TokenSymbol};
use utils::{
    consts::{
        ICP_LEDGER_CANISTER_ID, ICP_LEDGER_CANISTER_ID_STAGING, OGY_LEDGER_CANISTER_ID,
        OGY_LEDGER_CANISTER_ID_STAGING, SNS_LEDGER_CANISTER_ID, SNS_LEDGER_CANISTER_ID_STAGING,
    },
    env::CanisterEnv,
};

use crate::state::{Data, RuntimeState};

use super::init_canister;

#[derive(Deserialize, CandidType)]
pub struct Args {
    test_mode: bool,
}

#[init]
fn init(args: Args) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let data = Data::default();

    let runtime_state = RuntimeState::new(env, data);

    init_canister(runtime_state);

    info!("Init complete.")
}
