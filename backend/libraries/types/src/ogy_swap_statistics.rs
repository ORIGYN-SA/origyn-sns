use std::collections::HashMap;

use candid::{CandidType, Principal};
use ic_ledger_types::AccountIdentifier;
use serde::Deserialize;

#[derive(CandidType, Default, Deserialize, PartialEq, Eq, Debug)]
pub struct SwapStatistics {
    pub total_amount_swapped: u64,
    pub number_of_completed_swaps: u64,
    pub number_of_attempted_swaps: u64,
    pub number_of_failed_swaps: u64,
    pub number_of_stuck_swaps: u64,
    pub user_swaps: HashMap<Principal, UserSwap>,
    pub stuck_swaps: Vec<StuckSwap>,
}

#[derive(CandidType, Deserialize, PartialEq, Eq, Debug)]
pub struct UserSwap {
    pub desposit_account: AccountIdentifier,
    pub amount: u64,
    pub swaps: u64,
}

/// The stage a non-terminal swap is stuck in. Mirrors the in-progress variants of
/// `ogy_token_swap_api::token_swap::SwapStatus` (which the `types` crate can't depend on).
#[derive(CandidType, Deserialize, PartialEq, Eq, Debug, Clone)]
pub enum StuckStage {
    Init,
    BlockRequest,
    BlockValid,
    BurnRequest,
    BurnSuccess,
    TransferRequest,
}

#[derive(CandidType, Deserialize, PartialEq, Eq, Debug, Clone)]
pub struct StuckSwap {
    /// Legacy-ledger block index; the key of the swap map, used by the recovery endpoints.
    pub block_index: u64,
    pub principal: Principal,
    pub stage: StuckStage,
    /// Timestamp in ms of the last swap request for this block, to judge staleness.
    pub last_request: u64,
    pub amount: u64,
}
