use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Category {
    pub collection_ids: Vec<Principal>,
    pub total_collections: u64,
    pub hidden: bool,
}

impl Default for Category {
    fn default() -> Self {
        Self {
            collection_ids: Vec::new(),
            total_collections: 0,
            hidden: false,
        }
    }
}
