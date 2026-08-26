use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Default, Serialize, Deserialize, Clone, Debug)]
pub struct OverallStats {
    pub collections_total_value_locked: u64,
    pub total_collections: usize,
}
