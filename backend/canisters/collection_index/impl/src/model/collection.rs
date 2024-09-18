use candid::Principal;
use ic_stable_structures::BTreeMap as StableBTreeMap;
use collection_index_api::{ collection::Collection, errors::InsertCollectionError };
use serde::{ Deserialize, Serialize };

use crate::memory::{ get_collection_model_memory, VM };

#[derive(Serialize, Deserialize)]
pub struct CollectionModel {
    #[serde(skip, default = "init_collection_model")]
    collections: StableBTreeMap<Principal, Collection, VM>,
}

fn init_collection_model() -> StableBTreeMap<Principal, Collection, VM> {
    let memory = get_collection_model_memory();
    StableBTreeMap::init(memory)
}

impl Default for CollectionModel {
    fn default() -> Self {
        Self {
            collections: init_collection_model(),
        }
    }
}

impl CollectionModel {
    pub fn insert_collection(
        &mut self,
        collection_canister_id: Principal,
        collection: &Collection
    ) -> Result<bool, InsertCollectionError> {
        if self.collections.contains_key(&collection_canister_id) {
            return Err(InsertCollectionError::CollectionAlreadyExists);
        }

        self.collections.insert(collection_canister_id.clone(), collection.clone());

        Ok(true)
    }

    pub fn get_all_collections(&self, offset: usize, limit: usize) -> Vec<Collection> {
        let mut collections_vec: Vec<(Principal, Collection)> = self.collections.iter().collect();

        collections_vec.sort_by_key(|(_, coll)| !coll.is_promoted);

        collections_vec
            .iter()
            .skip(offset)
            .take(limit)
            .cloned()
            .map(|(_, col)| col)
            .collect()
    }

    pub fn total_collections(&self) -> u64 {
        self.collections.len()
    }
}
