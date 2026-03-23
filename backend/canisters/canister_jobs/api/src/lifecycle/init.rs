use candid::{CandidType, Principal};
use serde::Deserialize;
use types::CanisterId;
use serde::Serialize;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InitArgs {
    pub authorized_principals: Vec<Principal>,
    pub test_mode: bool,
    pub ledger_canister_id: CanisterId,
    pub burn_principal_id: Principal,
    pub daily_burn_amount: u64,
}
