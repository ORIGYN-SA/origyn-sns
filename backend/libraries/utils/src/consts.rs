use candid::Principal;
use types::CanisterId;

pub const E8S_PER_OGY: u64 = 100_000_000;
pub const E8S_FEE_OGY: u64 = 200_000;
// FIXME: change to real canister id when deployed
pub const SNS_GOVERNANCE_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 2, 0, 0, 125, 1, 1]);
