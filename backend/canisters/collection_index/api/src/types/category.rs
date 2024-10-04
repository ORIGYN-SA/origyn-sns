use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

pub type CategoryID = u64;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Category {
    pub collection_count: CategoryID,
    pub active: bool,
    pub name: String,
}

impl Default for Category {
    fn default() -> Self {
        Self {
            collection_count: 0u64,
            active: true,
            name: String::default(),
        }
    }
}
