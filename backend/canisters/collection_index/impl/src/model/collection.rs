use candid::Principal;
use collection_index_api::{
    category::Category,
    collection::{Collection, CollectionExtended},
    errors::{
        GetCollectionByPrincipal, GetCollectionsError, InsertCategoryError, InsertCollectionError,
        RemoveCategoryError, RemoveCollectionError, SetCategoryVisibilityError,
        TogglePromotedError, UpdateCollectionError,
    },
    get_collections::GetCollectionsResult,
    search_collections::SearchCollectionsResponse,
};
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::memory::{get_collection_model_memory, VM};

#[derive(Serialize, Deserialize)]
pub struct CollectionModel {
    #[serde(skip, default = "init_collection_model")]
    pub(crate) collections: StableBTreeMap<Principal, CollectionExtended, VM>,
    // NOTE: TVL for those collections is set once per full collection, so those collections don't participate in calculation jobs
    pub(crate) arbitrary_collections_tvl: HashMap<Principal, Collection>,
    pub(crate) categories: HashMap<String, Category>,
}

fn init_collection_model() -> StableBTreeMap<Principal, CollectionExtended, VM> {
    let memory = get_collection_model_memory();
    StableBTreeMap::init(memory)
}

impl Default for CollectionModel {
    fn default() -> Self {
        Self {
            collections: init_collection_model(),
            arbitrary_collections_tvl: HashMap::new(),
            categories: HashMap::new(),
        }
    }
}

impl CollectionModel {
    pub fn promote_collection() {}

    pub fn demote_collection() {}

    pub fn insert_category(&mut self, category_name: String) -> Result<(), InsertCategoryError> {
        if self.categories.contains_key(&category_name) {
            return Err(InsertCategoryError::CategoryAlreadyExists);
        }

        self.categories.insert(category_name, Category::default());

        Ok(())
    }

    pub fn remove_category(&mut self, category_name: String) -> Result<(), RemoveCategoryError> {
        if !self.categories.contains_key(&category_name) {
            return Err(RemoveCategoryError::CategoryNotFound);
        }

        self.categories.remove(&category_name);

        let extended_keys: Vec<Principal> = self
            .collections
            .iter()
            .filter_map(|entry| {
                if entry.value().category.as_deref() == Some(&category_name) {
                    Some(entry.key().clone())
                } else {
                    None
                }
            })
            .collect();

        let arbitrary_keys: Vec<Principal> = self
            .arbitrary_collections_tvl
            .iter()
            .filter_map(|(key, col)| {
                if col.category.as_deref() == Some(&category_name) {
                    Some(key.clone())
                } else {
                    None
                }
            })
            .collect();

        for key in extended_keys {
            if let Some(mut collection) = self.collections.remove(&key) {
                collection.category = None;
                self.collections.insert(key, collection);
            }
        }

        for key in arbitrary_keys {
            if let Some(mut collection) = self.arbitrary_collections_tvl.get(&key).cloned() {
                collection.category = None;
                self.arbitrary_collections_tvl.insert(key, collection);
            }
        }

        Ok(())
    }

    pub fn set_category_visibility(
        &mut self,
        category_name: String,
        switch: bool,
    ) -> Result<(), SetCategoryVisibilityError> {
        if let Some(category) = self.categories.get_mut(&category_name) {
            category.active = switch;
            Ok(())
        } else {
            Err(SetCategoryVisibilityError::CategoryNotFound)
        }
    }

    pub fn update_price(&mut self, canister_id: Principal, price: Option<u64>) {
        if let Some(mut col) = self.collections.remove(&canister_id) {
            col.item_price_usd = price;
            self.collections.insert(canister_id, col);
        }
    }

    pub fn update_collection(
        &mut self,
        collection_canister_id: Principal,
        new_category: Option<String>,
        new_locked_value_usd: Option<u64>,
    ) -> Result<(), UpdateCollectionError> {
        let mut category = None;
        let mut is_promoted = false;
        let mut name = None;
        let mut total_supply = None;
        let mut item_price_usd = None;
        let mut locked_value_usd = None;
        let mut is_extended = false;

        if let Some(col) = self.collections.get(&collection_canister_id) {
            category = col.category.clone();
            is_promoted = col.is_promoted;
            name = col.name.clone();
            total_supply = col.total_supply;
            item_price_usd = col.item_price_usd;
            is_extended = true;
        } else if let Some(col) = self.arbitrary_collections_tvl.get(&collection_canister_id) {
            category = col.category.clone();
            is_promoted = col.is_promoted;
            name = col.name.clone();
            locked_value_usd = col.locked_value_usd;
            total_supply = None;
        } else {
            return Err(UpdateCollectionError::CollectionNotFound);
        }

        let old_category_id = category.clone();
        let mut final_category = category;

        if let Some(new_cat) = new_category {
            // check the new category exists
            if !self.categories.contains_key(&new_cat) {
                return Err(UpdateCollectionError::CategoryNotFound(format!(
                    "Can't update collection because the new category: {new_cat} does not exist"
                )));
            }

            // if an old category is set then minus one from it's collection count
            if let Some(old_cat_id) = old_category_id {
                if let Some(cat) = self.categories.get_mut(&old_cat_id) {
                    if cat.collection_count > 0u64 {
                        cat.collection_count = cat.collection_count - 1;
                    }
                }
            }

            // set the new category and update the categorie's collection count
            if let Some(category) = self.categories.get_mut(&new_cat) {
                category.collection_count += 1;
            }
            final_category = Some(new_cat);
        }

        if let Some(new_locked_val) = new_locked_value_usd {
            if is_extended {
                self.collections.remove(&collection_canister_id);
            }
            let updated = Collection {
                canister_id: collection_canister_id,
                name,
                category: final_category,
                is_promoted,
                locked_value_usd: Some(new_locked_val),
            };
            self.arbitrary_collections_tvl.insert(collection_canister_id, updated);
        } else {
            if is_extended {
                let updated = CollectionExtended {
                    canister_id: collection_canister_id,
                    name,
                    category: final_category,
                    is_promoted,
                    total_supply,
                    item_price_usd,
                };
                self.collections.insert(collection_canister_id, updated);
            } else {
                let updated = Collection {
                    canister_id: collection_canister_id,
                    name,
                    category: final_category,
                    is_promoted,
                    locked_value_usd,
                };
                self.arbitrary_collections_tvl.insert(collection_canister_id, updated);
            }
        }

        Ok(())
    }

    pub fn toggle_promoted(
        &mut self,
        collection_canister_id: Principal,
    ) -> Result<(), TogglePromotedError> {
        if let Some(mut collection) = self.collections.remove(&collection_canister_id) {
            collection.is_promoted = !collection.is_promoted;
            self.collections.insert(collection_canister_id, collection);
            Ok(())
        } else if let Some(mut collection) = self.arbitrary_collections_tvl.remove(&collection_canister_id) {
            collection.is_promoted = !collection.is_promoted;
            self.arbitrary_collections_tvl.insert(collection_canister_id, collection);
            Ok(())
        } else {
            Err(TogglePromotedError::CollectionNotFound)
        }
    }

    pub fn insert_collection(
        &mut self,
        collection_canister_id: Principal,
        collection: &mut Collection,
        category: Option<String>,
    ) -> Result<(), InsertCollectionError> {
        println!("collection to insert {collection:?}");
        if self.collections.contains_key(&collection_canister_id) || self.arbitrary_collections_tvl.contains_key(&collection_canister_id) {
            return Err(InsertCollectionError::CollectionAlreadyExists);
        }

        if let Some(target_category) = category {
            let found_category = if let Some(cat) = self.categories.get_mut(&target_category) {
                collection.category = Some(target_category);
                cat
            } else {
                return Err(
                    InsertCollectionError::CategoryNotFound(
                        format!(
                            "Category {target_category} could not be found. failed to insert new collection"
                        )
                    )
                );
            };

            found_category.collection_count += 1;
        }

        if collection.locked_value_usd.is_some() {
            self.arbitrary_collections_tvl.insert(collection_canister_id, collection.clone());
        } else {
            let extended = CollectionExtended {
                canister_id: collection.canister_id,
                name: collection.name.clone(),
                category: collection.category.clone(),
                is_promoted: collection.is_promoted,
                total_supply: None,
                item_price_usd: None,
            };
            self.collections.insert(collection_canister_id, extended);
        }
        Ok(())
    }

    pub fn remove_collection(
        &mut self,
        collection_canister_id: Principal,
    ) -> Result<(), RemoveCollectionError> {
        let category = if let Some(collection) = self.collections.remove(&collection_canister_id) {
            collection.category
        } else if let Some(collection) = self.arbitrary_collections_tvl.remove(&collection_canister_id) {
            collection.category
        } else {
            return Err(RemoveCollectionError::CollectionNotFound);
        };

        if let Some(category_name) = &category {
            if let Some(category) = self.categories.get_mut(category_name) {
                if category.collection_count > 0u64 {
                    category.collection_count = category.collection_count - 1;
                }
            }
        }

        Ok(())
    }

    pub fn get_collections(
        &self,
        categories: Option<Vec<String>>,
        offset: usize,
        limit: usize,
    ) -> Result<GetCollectionsResult, GetCollectionsError> {
        let mut cat_names: Vec<String> = vec![];
        let cats: Vec<(String, Category)> = if let Some(items) = categories {
            let full_cats = items
                .iter()
                .filter_map(|cat_name| {
                    let cat = self.categories.get(&cat_name.clone());
                    if let Some(category) = cat {
                        if category.active {
                            cat_names.push(cat_name.clone());
                            Some((cat_name.clone(), category.clone()))
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

        // collect all collections from both
        let mut cols: Vec<Collection> = self
            .collections
            .iter()
            .map(|entry| entry.value().clone().into())
            .collect();
        for col in self.arbitrary_collections_tvl.values() {
            cols.push(col.clone());
        }

        // make sure promoted are first
        cols.sort_by(|a, b| {
            match b.is_promoted.cmp(&a.is_promoted) {
                std::cmp::Ordering::Equal => a.canister_id.cmp(&b.canister_id),
                other => other,
            }
        });

        // apply category filtering
        let filtered_cols: Vec<Collection> = cols
            .into_iter()
            .filter(|collection| match cat_names.len() {
                0 => true,
                _ => {
                    if let Some(collection_cat_name) = collection.category.clone() {
                        cat_names.contains(&collection_cat_name)
                    } else {
                        false
                    }
                }
            })
            .collect();

        let total_pages: u64 = match (filtered_cols.len() as u64).checked_div(limit as u64) {
            Some(pages) => {
                if pages == 0 {
                    1
                } else {
                    pages
                }
            }
            None => 1,
        };

        let collections: Vec<Collection> = filtered_cols
            .into_iter()
            .skip(offset)
            .take(limit)
            .collect();

        Ok(GetCollectionsResult {
            collections,
            total_pages,
        })
    }

    pub fn search_collections(
        &self,
        categories: Option<Vec<String>>,
        search_query: String,
        offset: usize,
        limit: usize,
    ) -> SearchCollectionsResponse {
        let mut cat_names: Vec<String> = vec![];

        let cats: Vec<(String, Category)> = if let Some(items) = categories {
            let full_cats = items
                .iter()
                .filter_map(|cat_name| {
                    let cat = self.categories.get(cat_name);
                    if let Some(category) = cat {
                        if category.active {
                            cat_names.push(cat_name.clone());
                            Some((cat_name.clone(), category.clone()))
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

        // collect all collections from both
        let mut cols: Vec<Collection> = self
            .collections
            .iter()
            .map(|entry| entry.value().clone().into())
            .collect();
        for col in self.arbitrary_collections_tvl.values() {
            cols.push(col.clone());
        }

        // make sure promoted are first
        cols.sort_by(|a, b| {
            match b.is_promoted.cmp(&a.is_promoted) {
                std::cmp::Ordering::Equal => a.canister_id.cmp(&b.canister_id),
                other => other,
            }
        });

        // apply pagination and category filtering
        let collections: Vec<Collection> = cols
            .into_iter()
            .filter(|collection| match cat_names.len() {
                0 => check_search_hit(&collection.name, &search_query),
                _ => {
                    if let Some(collection_cat_name) = collection.category.clone() {
                        cat_names.contains(&collection_cat_name)
                            && check_search_hit(&collection.name, &search_query)
                    } else {
                        false
                    }
                }
            })
            .collect();

        let total_pages = match (collections.len() as u64).checked_div(limit as u64) {
            Some(pages) => {
                if pages == 0 {
                    1
                } else {
                    pages
                }
            }
            None => 1,
        };

        let collections: Vec<Collection> =
            collections.into_iter().skip(offset).take(limit).collect();

        SearchCollectionsResponse {
            collections,
            total_pages,
        }
    }

    pub fn get_all_categories(&self) -> Vec<(String, Category)> {
        self.categories
            .iter()
            .map(|(name, cat)| (name.clone(), cat.clone()))
            .collect()
    }

    pub fn total_collections(&self) -> u64 {
        self.collections.len() + self.arbitrary_collections_tvl.len() as u64
    }

    pub fn get_all_collections(&self) -> Vec<Collection> {
        let mut all: Vec<Collection> = self
            .collections
            .iter()
            .map(|entry| entry.value().clone().into())
            .collect();
        for col in self.arbitrary_collections_tvl.values() {
            all.push(col.clone());
        }
        all
    }

    pub fn upsert_collection_value(
        &mut self,
        canister_id: Principal,
        name: Option<String>,
        _locked_value_usd: u64,
        total_supply: Option<u64>,
    ) {
        if let Some(mut collection) = self.collections.remove(&canister_id) {
            collection.total_supply = total_supply;
            if collection.name.is_none() {
                collection.name = name;
            }
            self.collections.insert(canister_id, collection);
        } else {
            self.collections.insert(
                canister_id,
                CollectionExtended {
                    canister_id,
                    name,
                    category: None,
                    is_promoted: false,
                    total_supply,
                    item_price_usd: None,
                },
            );
        }
    }

    pub fn upsert_collection_metadata(&mut self, canister_id: Principal, name: Option<String>) {
        // Collections newly discovered via the minting studio have no admin-set
        // price yet; default to $500/item so they still count towards the TVL
        // until an admin overrides it with `set_item_price`.
        const DEFAULT_ITEM_PRICE_USD: u64 = 500;

        if let Some(mut collection) = self.collections.remove(&canister_id) {
            if collection.name != name {
                collection.name = name;
                self.collections.insert(canister_id, collection);
            } else {
                self.collections.insert(canister_id, collection);
            }
        } else {
            self.collections.insert(
                canister_id,
                CollectionExtended {
                    canister_id,
                    name,
                    category: None,
                    is_promoted: false,
                    total_supply: None,
                    item_price_usd: Some(DEFAULT_ITEM_PRICE_USD),
                },
            );
        }
    }

    pub fn get_collection_by_key(
        &self,
        canister_id: Principal,
    ) -> Result<Collection, GetCollectionByPrincipal> {
        if let Some(collection) = self.collections.get(&canister_id) {
            return Ok(collection.clone().into());
        }
        if let Some(collection) = self.arbitrary_collections_tvl.get(&canister_id) {
            return Ok(collection.clone());
        }
        Err(GetCollectionByPrincipal::CollectionNotFound)
    }
}

fn check_search_hit(collection_name: &Option<String>, search_string: &String) -> bool {
    if let Some(name) = collection_name {
        // Convert both the collection name and search string to lowercase
        let name_lowercase = name.to_lowercase();
        let search_string_lowercase = search_string.to_lowercase();

        // Check if the entire search string is a substring of the collection name
        name_lowercase.contains(&search_string_lowercase)
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;
    use collection_index_api::collection::Collection;

    fn mock_principal(id: u8) -> Principal {
        Principal::from_slice(&[id; 29])
    }

    #[test]
    fn test_category_management() {
        let mut model = CollectionModel::default();
        
        // Assert empty initial categories or clear for test isolation
        model.categories.clear();
        assert!(model.get_all_categories().is_empty());

        // Insert category
        assert!(model.insert_category("Art".to_string()).is_ok());
        assert_eq!(model.get_all_categories().len(), 1);
        assert_eq!(model.get_all_categories()[0].0, "Art");

        // Insert duplicate category should fail
        assert!(model.insert_category("Art".to_string()).is_err());

        // Remove category
        assert!(model.remove_category("Art".to_string()).is_ok());
        assert!(model.get_all_categories().is_empty());

        // Remove non-existent category should fail
        assert!(model.remove_category("NonExistent".to_string()).is_err());
    }

    #[test]
    fn test_insert_and_get_collection() {
        let mut model = CollectionModel::default();
        let p = mock_principal(1);

        // Clear if already exists in thread-local storage
        let _ = model.remove_collection(p);

        // Insert simple collection (locked_value_usd = None)
        let mut collection = Collection {
            canister_id: p,
            name: Some("Simple NFT".to_string()),
            category: None,
            is_promoted: false,
            locked_value_usd: None,
        };
        assert!(model.insert_collection(p, &mut collection, None).is_ok());

        // Fetch collection by key
        let fetched = model.get_collection_by_key(p).unwrap();
        assert_eq!(fetched.name, Some("Simple NFT".to_string()));
        assert_eq!(fetched.locked_value_usd, None);

        // Insert duplicate should fail
        assert!(model.insert_collection(p, &mut collection, None).is_err());
    }

    #[test]
    fn test_insert_arbitrary_collection() {
        let mut model = CollectionModel::default();
        let p = mock_principal(2);

        // Clear if already exists
        let _ = model.remove_collection(p);

        // Insert arbitrary collection (locked_value_usd = Some(500))
        let mut collection = Collection {
            canister_id: p,
            name: Some("Arbitrary NFT".to_string()),
            category: None,
            is_promoted: false,
            locked_value_usd: Some(500),
        };
        assert!(model.insert_collection(p, &mut collection, None).is_ok());
        
        let fetched = model.get_collection_by_key(p).unwrap();
        assert_eq!(fetched.locked_value_usd, Some(500));
        assert!(model.arbitrary_collections_tvl.contains_key(&p));
    }

    #[test]
    fn test_update_price() {
        let mut model = CollectionModel::default();
        let p = mock_principal(3);

        // Clear if already exists
        let _ = model.remove_collection(p);

        let mut collection = Collection {
            canister_id: p,
            name: Some("Pricey NFT".to_string()),
            category: None,
            is_promoted: false,
            locked_value_usd: None,
        };
        assert!(model.insert_collection(p, &mut collection, None).is_ok());

        // Update total supply (simulating job sync)
        model.upsert_collection_value(p, Some("Pricey NFT".to_string()), 0, Some(10));
        
        // Update price
        model.update_price(p, Some(150));

        let fetched = model.get_collection_by_key(p).unwrap();
        // locked_value_usd = item_price_usd (150) * total_supply (10) = 1500
        assert_eq!(fetched.locked_value_usd, Some(1500));

        // Clear price
        model.update_price(p, None);
        let fetched_none = model.get_collection_by_key(p).unwrap();
        assert_eq!(fetched_none.locked_value_usd, None);
    }

    #[test]
    fn test_remove_collection() {
        let mut model = CollectionModel::default();
        let p = mock_principal(4);

        // Clear if already exists
        let _ = model.remove_collection(p);

        let mut collection = Collection {
            canister_id: p,
            name: Some("Temp NFT".to_string()),
            category: None,
            is_promoted: false,
            locked_value_usd: None,
        };
        assert!(model.insert_collection(p, &mut collection, None).is_ok());

        assert!(model.remove_collection(p).is_ok());
        assert!(model.get_collection_by_key(p).is_err());
    }

    #[test]
    fn test_query_filtering_and_pagination() {
        let mut model = CollectionModel::default();
        
        // Setup categories
        let _ = model.insert_category("Rare".to_string());
        let _ = model.insert_category("Common".to_string());

        // Insert collections
        for i in 10..=14 {
            let p = mock_principal(i);
            let _ = model.remove_collection(p);
            let mut col = Collection {
                canister_id: p,
                name: Some(format!("NFT {}", i)),
                category: None,
                is_promoted: i % 2 == 0,
                locked_value_usd: None,
            };
            let cat = if i % 2 == 0 { "Rare".to_string() } else { "Common".to_string() };
            assert!(model.insert_collection(p, &mut col, Some(cat)).is_ok());
        }

        // Get all collections - check promoted are first
        let result = model.get_collections(None, 0, 10).unwrap();
        assert!(result.collections.len() >= 5);
        assert!(result.collections[0].is_promoted);

        // Get collections filtered by category "Rare"
        let result_rare = model.get_collections(Some(vec!["Rare".to_string()]), 0, 10).unwrap();
        assert!(result_rare.collections.iter().all(|c| c.category.as_deref() == Some("Rare")));

        // Search collections
        let search_res = model.search_collections(None, "NFT 12".to_string(), 0, 10);
        assert_eq!(search_res.collections.len(), 1);
        assert_eq!(search_res.collections[0].name.as_deref(), Some("NFT 12"));
    }
}
