use std::collections::BTreeMap;
use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use collection_index_api::{
    collection::Collection,
    errors::{
        GetCollectionsError,
        InsertCategoryError,
        InsertCollectionError,
        SetCategoryHiddenError,
        UpdateCollectionCategoryError,
    },
};
use serde::{ Deserialize, Serialize };

use crate::memory::{ get_collection_model_memory, VM };

#[derive(Serialize, Deserialize, Clone)]
pub struct Category {
    collection_ids: Vec<Principal>,
    total_collections: u64,
    hidden: bool,
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
#[derive(Serialize, Deserialize)]
pub struct CollectionModel {
    #[serde(skip, default = "init_collection_model")]
    collections: StableBTreeMap<Principal, Collection, VM>,

    #[serde(skip, default = "init_category_memory")]
    categories: BTreeMap<String, Category>,
}

fn init_collection_model() -> StableBTreeMap<Principal, Collection, VM> {
    let memory = get_collection_model_memory();
    StableBTreeMap::init(memory)
}

fn init_category_memory() -> BTreeMap<String, Category> {
    BTreeMap::new()
}

impl Default for CollectionModel {
    fn default() -> Self {
        Self {
            collections: init_collection_model(),
            categories: init_category_memory(),
        }
    }
}

impl CollectionModel {
    pub fn promote_collection() {}

    pub fn demote_collection() {}

    pub fn insert_category(&mut self, category_name: String) -> Result<bool, InsertCategoryError> {
        if self.categories.contains_key(&category_name) {
            return Err(InsertCategoryError::CategoryAlreadyExists);
        }

        self.categories.insert(category_name.clone(), Category::default());

        Ok(true)
    }

    pub fn set_category_hidden(
        &mut self,
        category_name: &str,
        hidden: bool
    ) -> Result<bool, SetCategoryHiddenError> {
        if let Some(category) = self.categories.get_mut(category_name) {
            category.hidden = hidden;
            Ok(true)
        } else {
            Err(SetCategoryHiddenError::CategoryNotFound)
        }
    }

    pub fn update_collection_category(
        &mut self,
        collection_canister_id: Principal,
        new_category: String
    ) -> Result<bool, UpdateCollectionCategoryError> {
        if !self.collections.contains_key(&collection_canister_id) {
            return Err(UpdateCollectionCategoryError::CollectionNotFound);
        }

        if !self.categories.contains_key(&new_category) {
            return Err(UpdateCollectionCategoryError::CategoryNotFound(new_category.clone()));
        }

        for (_, category) in self.categories.iter_mut() {
            if category.collection_ids.contains(&collection_canister_id) {
                category.collection_ids.retain(|id| id != &collection_canister_id);
                category.total_collections -= 1;
                break;
            }
        }

        if let Some(new_category) = self.categories.get_mut(&new_category) {
            new_category.collection_ids.push(collection_canister_id.clone());
            new_category.total_collections += 1;
        }

        Ok(true)
    }

    pub fn insert_collection(
        &mut self,
        collection_canister_id: Principal,
        collection: &Collection,
        category_name: String
    ) -> Result<bool, InsertCollectionError> {
        if self.collections.contains_key(&collection_canister_id) {
            return Err(InsertCollectionError::CollectionAlreadyExists);
        }

        if !self.categories.contains_key(&category_name) {
            return Err(InsertCollectionError::CategoryNotFound(category_name));
        }

        self.collections.insert(collection_canister_id.clone(), collection.clone());

        if let Some(category) = self.categories.get_mut(&category_name) {
            category.collection_ids.push(collection_canister_id.clone());
            category.total_collections += 1;
        }

        Ok(true)
    }

    pub fn get_all_collections(
        &self,
        offset: usize,
        limit: usize
    ) -> Result<Vec<Collection>, GetCollectionsError> {
        let mut collections_vec: Vec<(Principal, Collection)> = self.collections.iter().collect();

        collections_vec.sort_by_key(|(_, coll)| !coll.is_promoted);

        Ok(
            collections_vec
                .iter()
                .skip(offset)
                .take(limit)
                .cloned()
                .map(|(_, col)| col)
                .collect()
        )
    }

    pub fn get_collections_by_category(
        &self,
        category_name: String,
        offset: usize,
        limit: usize
    ) -> Result<Vec<Collection>, GetCollectionsError> {
        if let Some(category) = self.categories.get(&category_name) {
            let collection_ids = &category.collection_ids;

            let paginated_ids = collection_ids
                .iter()
                .skip(offset)
                .take(limit)
                .cloned()
                .collect::<Vec<Principal>>();

            let mut collections = Vec::new();
            for collection_id in paginated_ids {
                if let Some(collection) = self.collections.get(&collection_id) {
                    collections.push(collection.clone());
                }
            }

            Ok(collections)
        } else {
            Err(GetCollectionsError::CategoryNotFound(category_name))
        }
    }

    pub fn get_all_categories(&self) -> Vec<(String, Category)> {
        self.categories
            .iter()
            .map(|(name, cat)| (name.clone(), cat.clone()))
            .collect()
    }

    pub fn total_collections(&self) -> u64 {
        self.collections.len()
    }
}
