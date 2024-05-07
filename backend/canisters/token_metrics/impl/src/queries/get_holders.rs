use candid::{ CandidType, Principal };
use ic_cdk_macros::query;
use ic_stable_structures::BTreeMap;

use crate::state::{ read_state, WalletOverview };

#[derive(CandidType)]
pub struct GetHoldersArgs {
    pub offset: u64,
    pub limit: u64,
}

#[query]
fn get_holders(args: GetHoldersArgs) -> BTreeMap<String, WalletOverview> {
    // state getter here
}
