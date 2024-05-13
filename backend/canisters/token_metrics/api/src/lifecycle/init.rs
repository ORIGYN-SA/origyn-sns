use candid::CandidType;
use serde::Deserialize;
use types::CanisterId;

#[derive(Deserialize, CandidType)]
pub struct InitArgs {
    pub test_mode: bool,
    pub sns_governance_canister_id: CanisterId,
    pub super_stats_canister_id: CanisterId,
    pub ogy_new_ledger_canister_id: CanisterId,
}
