#![cfg(test)]

use candid::Principal;
use pocket_ic::PocketIc;
use types::{ CanisterId, Cycles };

mod client;
mod init;
mod ogy_legacy_ledger;
mod tests;
mod utils;
mod wasms;

const T: Cycles = 1_000_000_000_000;

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
