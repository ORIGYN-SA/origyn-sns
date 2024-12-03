use candid::Principal;
use pocket_ic::PocketIc;
use types::CanisterId;

mod init;
mod nft_utils;
mod tests;

pub struct TestEnv {
    pub pic: PocketIc,
    pub canister_ids: CanisterIds,
    pub principal_ids: PrincipalIds,
}

#[derive(Debug, Clone)]
pub struct PrincipalIds {
    net_principal: Principal,
    controller: Principal,
    originator: Principal,
    nft_owner: Principal,
}
#[derive(Debug)]
pub struct CanisterIds {
    pub origyn_nft_one: CanisterId,
    pub origyn_nft_two: CanisterId,
    pub collection_index: CanisterId,
}
