use candid::CandidType;
use serde::{ Deserialize, Serialize };

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Category {
    pub collection_count: u64,
    pub active: bool,
}

impl Default for Category {
    fn default() -> Self {
        Self {
            collection_count: 0u64,
            active: true,
        }
    }
}
