use candid::{ CandidType };
use ic_stable_memory::{ derive::{ StableType, AsFixedSizeBytes }, collections::{ SBTreeMap } };
use serde::{ Deserialize, Serialize };

// Stable Store of account indexed data
#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountTree {
    pub accounts: SBTreeMap<u64, Overview>,
    count: u64, // not used
    last_updated: u64, // not used
}

#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountData {
    pub overview: Overview,
}

#[derive(CandidType, StableType, Deserialize, Serialize, Clone, Default, AsFixedSizeBytes, Debug)]
pub struct Overview {
    pub first_active: u64,
    pub last_active: u64,
    pub sent: (u32, u128), // count, value
    pub received: (u32, u128), // count, value
    pub balance: u128,
}
