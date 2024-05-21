use candid::CandidType;
use ic_stable_memory::derive::StableType;
use serde::{Deserialize, Serialize};

use crate::account_tree::HistoryData;


#[derive(CandidType, StableType, Deserialize, Serialize, Clone, Default, Debug)]

pub struct GetAccountBalanceHistory {
    pub account: String,
    pub days: u64,
    pub merge_subaccounts: bool,
}

pub type Args = GetAccountBalanceHistory;
pub type Response = Vec<(u64, HistoryData)>;
