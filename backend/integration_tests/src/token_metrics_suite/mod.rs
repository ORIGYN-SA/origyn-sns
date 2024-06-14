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
    pub ogy_new_ledger: CanisterId,
    pub ogy_super_stats: CanisterId,
    pub ogy_governance: CanisterId,
}
