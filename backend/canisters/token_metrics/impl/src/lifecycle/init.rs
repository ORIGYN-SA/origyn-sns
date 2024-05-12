use candid::{ CandidType, Principal };
use ic_cdk_macros::init;
use serde::Deserialize;
use tracing::info;
use types::CanisterId;
use utils::env::CanisterEnv;

use crate::state::{ Data, RuntimeState };

use super::init_canister;

#[derive(Deserialize, CandidType)]
pub struct InitArgs {
    pub test_mode: bool,
    pub sns_governance_canister_id: CanisterId,
    pub super_stats_canister_id: CanisterId,
    pub ogy_legacy_ledger_canister_id: CanisterId,
    pub ogy_new_ledger_canister_id: CanisterId,
    pub ogy_legacy_minting_account_principal: Principal,
}

#[init]
fn init(args: InitArgs) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let data = Data::new(
        args.ogy_new_ledger_canister_id,
        args.ogy_legacy_ledger_canister_id,
        args.ogy_legacy_minting_account_principal,
        args.super_stats_canister_id,
        args.sns_governance_canister_id
    );

    let runtime_state = RuntimeState::new(env.clone(), data);

    init_canister(runtime_state);

    info!("Init complete.")
}
