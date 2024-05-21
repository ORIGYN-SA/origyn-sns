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
    pub ogy_swap: CanisterId,
    pub ogy_legacy_ledger: CanisterId,
    pub ogy_new_ledger: CanisterId,
}
