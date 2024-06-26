use std::collections::HashMap;

use candid::{ CandidType, Principal };
use ic_ledger_types::AccountIdentifier;
use serde::Deserialize;

#[derive(CandidType, Default, Deserialize, PartialEq, Eq, Debug)]
pub struct SwapStatistics {
    pub total_amount_swapped: u64,
    pub number_of_completed_swaps: u64,
    pub number_of_attempted_swaps: u64,
    pub number_of_failed_swaps: u64,
    pub user_swaps: HashMap<Principal, UserSwap>,
}

#[derive(CandidType, Deserialize, PartialEq, Eq, Debug)]
pub struct UserSwap {
    pub desposit_account: AccountIdentifier,
    pub amount: u64,
    pub swaps: u64,
}
