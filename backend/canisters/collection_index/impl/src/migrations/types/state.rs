use serde::{Deserialize, Serialize};
use utils::env::CanisterEnv;
use crate::memory::VM;
use collection_index_api::collection::Collection;
use collection_index_api::category::Category;
use candid::Principal;
use std::collections::HashMap;
use collection_index_api::stats::OverallStats;
use ic_stable_structures::StableBTreeMap;

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    pub env: CanisterEnv,
    pub data: DataV0,
}

#[derive(Serialize, Deserialize)]
pub struct DataV0 {
    /// Authorised principals for guarded calls
    pub authorised_principals: Vec<Principal>,
    /// collection of nft canisters
    pub collections: CollectionModelV0,
    /// Overall computed stats
    pub overall_stats: OverallStats,
}

#[derive(Serialize, Deserialize)]
pub struct CollectionModelV0 {
    #[serde(skip, default = "init_collection_model")]
    pub collections: StableBTreeMap<Principal, Collection, VM>,
    pub categories: HashMap<String, Category>,
}

use crate::memory::get_collection_model_memory;
fn init_collection_model() -> StableBTreeMap<Principal, Collection, VM> {
    let memory = get_collection_model_memory();
    StableBTreeMap::init(memory)
}