use std::{ borrow::BorrowMut, collections::{ BTreeMap, HashMap } };
use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use collection_index_api::{
    category::{ Category, CategoryID },
    collection::{ Collection, GetCollectionsFilters },
    errors::{
        GetCollectionsError,
        InsertCategoryError,
        InsertCollectionError,
        RemoveCollectionError,
        SetCategoryHiddenError,
        UpdateCollectionCategoryError,
    },
    get_collections::GetCollectionsResult,
};
use serde::{ Deserialize, Serialize };

use crate::memory::{ get_collection_model_memory, VM };

#[derive(Serialize, Deserialize)]
pub struct CollectionModel {
    #[serde(skip, default = "init_collection_model")]
    collections: StableBTreeMap<Principal, Collection, VM>,
    categories: HashMap<u64, Category>,
}

fn init_collection_model() -> StableBTreeMap<Principal, Collection, VM> {
    let memory = get_collection_model_memory();
    StableBTreeMap::init(memory)
}

impl Default for CollectionModel {
    fn default() -> Self {
        Self {
            collections: init_collection_model(),
            categories: HashMap::new(),
        }
    }
}

impl CollectionModel {
    pub fn promote_collection() {}

    pub fn demote_collection() {}

    pub fn insert_category(&mut self, category_name: String) -> Result<(), InsertCategoryError> {
        if
            self.categories
                .iter()
                .any(|cat| cat.1.name.to_lowercase() == category_name.to_lowercase())
        {
            return Err(InsertCategoryError::CategoryAlreadyExists);
        }

        let mut new_category = Category::default();
        new_category.name = category_name;
        self.categories.insert(self.categories.len() as u64, new_category);

        Ok(())
    }

    pub fn set_category_inactive(
        &mut self,
        category_id: &CategoryID,
        switch: bool
    ) -> Result<(), SetCategoryHiddenError> {
        if let Some(category) = self.categories.get_mut(category_id) {
            category.active = switch;
            Ok(())
        } else {
            Err(SetCategoryHiddenError::CategoryNotFound)
        }
    }

    pub fn update_collection_category(
        &mut self,
        collection_canister_id: Principal,
        new_category_id: CategoryID
    ) -> Result<(), UpdateCollectionCategoryError> {
        if let Some(category) = self.categories.get_mut(&new_category_id) {
            if let Some(mut collection) = self.collections.get(&collection_canister_id) {
                collection.category = Some(new_category_id.clone());

                self.collections.remove(&collection.canister_id);
                self.collections.insert(collection_canister_id, collection);

                category.collection_count += 1;
                Ok(())
            } else {
                Err(UpdateCollectionCategoryError::CollectionNotFound)
            }
        } else {
            Err(
                UpdateCollectionCategoryError::CategoryNotFound(
                    format!("Category not found for category id : {new_category_id}")
                )
            )
        }
    }

    pub fn insert_collection(
        &mut self,
        collection_canister_id: Principal,
        collection: &mut Collection,
        category_id: u64
    ) -> Result<(), InsertCollectionError> {
        if self.collections.contains_key(&collection_canister_id) {
            return Err(InsertCollectionError::CollectionAlreadyExists);
        }

        let category = if let Some(cat) = self.categories.get_mut(&category_id) {
            cat
        } else {
            return Err(
                InsertCollectionError::CategoryNotFound(
                    format!(
                        "Category with an id of {category_id} could not be found. failed to insert new collection"
                    )
                )
            );
        };

        self.collections.insert(collection_canister_id.clone(), collection.clone());
        category.collection_count += 1;
        Ok(())
    }

    pub fn remove_collection(
        &mut self,
        collection_canister_id: Principal
    ) -> Result<(), RemoveCollectionError> {
        if let Some(collection) = self.collections.remove(&collection_canister_id) {
            if let Some(cat_id) = &collection.category {
                if let Some(category) = self.categories.get_mut(cat_id) {
                    category.collection_count -= 1;
                }
            }

            Ok(())
        } else {
            Err(RemoveCollectionError::CollectionNotFound)
        }
    }

    pub fn get_collections(
        &self,
        categories: Option<Vec<u64>>,
        offset: usize,
        limit: usize
    ) -> Result<GetCollectionsResult, GetCollectionsError> {
        let mut cat_ids: Vec<u64> = vec![];
        let cats: Vec<(CategoryID, Category)> = if let Some(ids) = categories {
            let full_cats = ids
                .iter()
                .filter_map(|cat_id| {
                    let cat = self.categories.get(cat_id);
                    if let Some(category) = cat {
                        if category.active {
                            cat_ids.push(cat_id.clone());
                            Some((cat_id.clone(), category.clone()))
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                })
                .collect();
            full_cats
        } else {
            vec![]
        };

        let total_pages: u64 = match cat_ids.len() {
            0 => { self.collections.len() }
            _ => {
                cats.iter()
                    .map(|(_, cat)| cat.collection_count)
                    .sum()
            }
        };

        let collections: Vec<Collection> = self.collections
            .iter()
            .filter(|(id, collection)| {
                match cat_ids.len() {
                    0 => { true }
                    _ => {
                        if let Some(collection_cat_id) = collection.category {
                            cat_ids.contains(&&collection_cat_id)
                        } else {
                            false
                        }
                    }
                }
            })
            .skip(offset)
            .take(limit)
            .map(|(prin, col)| col.clone())
            .collect();

        Ok(GetCollectionsResult {
            collections,
            total_pages,
        })
    }

    pub fn get_all_categories(&self) -> Vec<(CategoryID, Category)> {
        self.categories
            .iter()
            .map(|(name, cat)| (name.clone(), cat.clone()))
            .collect()
    }

    pub fn total_collections(&self) -> u64 {
        self.collections.len()
    }
}
