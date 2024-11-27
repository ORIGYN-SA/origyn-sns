use candid::CandidType;
use serde::{ Deserialize, Serialize };

pub type CategoryID = u64;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Category {
    pub collection_count: CategoryID,
    pub active: bool,
    pub name: String,
}

impl Category {
    pub fn new(name: &str) -> Self {
        Self {
            collection_count: 0u64,
            active: true,
            name: name.to_string(),
        }
    }
}
