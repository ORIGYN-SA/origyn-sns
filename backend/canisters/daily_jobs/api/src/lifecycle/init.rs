use candid::{ CandidType, Principal };
use serde::Deserialize;
use types::CanisterId;

#[derive(Deserialize, CandidType)]
pub struct InitArgs {
    pub test_mode: bool,
    pub ledger_canister_id: CanisterId,
    pub burn_principal_id: Principal,
    pub daily_burn_amount: u64,
}
