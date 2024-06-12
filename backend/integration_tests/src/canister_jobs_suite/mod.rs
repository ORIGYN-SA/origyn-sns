use candid::Principal;
use pocket_ic::PocketIc;
use types::CanisterId;

mod init;
mod tests;

pub struct TestEnv {
    pub pic: PocketIc,
    pub canister_ids: CanisterIds,
    pub controller: Principal,
}

#[derive(Debug)]
pub struct CanisterIds {
    pub ogy_ledger_canister_id: CanisterId,
    pub canister_jobs_canister_id: CanisterId,
}
