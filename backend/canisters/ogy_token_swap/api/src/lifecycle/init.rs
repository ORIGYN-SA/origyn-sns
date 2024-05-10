use candid::{ CandidType, Principal };
use serde::Deserialize;
use types::CanisterId;

#[derive(Deserialize, CandidType)]
pub struct InitArgs {
    pub test_mode: bool,
    pub ogy_legacy_ledger_canister_id: CanisterId,
    pub ogy_new_ledger_canister_id: CanisterId,
    pub ogy_legacy_minting_account_principal: Principal,
}
