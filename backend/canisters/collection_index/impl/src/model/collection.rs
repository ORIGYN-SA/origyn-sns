use std::{ borrow::BorrowMut, collections::{ BTreeMap, HashMap }, ops::Div };
use candid::Principal;
use ic_stable_structures::StableBTreeMap;
use collection_index_api::{
    category::{ Category, CategoryID },
    collection::{ Collection, GetCollectionsFilters },
    errors::{
        GetCollectionByPrincipal,
        GetCollectionsError,
        InsertCategoryError,
        InsertCollectionError,
        RemoveCollectionError,
        SetCategoryVisibilityError,
        UpdateCollectionCategoryError,
    },
    get_collections::GetCollectionsResult,
    search_collections::SearchCollectionsResponse,
};
use serde::{ Deserialize, Serialize };
use tracing::trace;

use crate::{ memory::{ get_collection_model_memory, VM }, utils::trace };

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

    pub fn set_category_visibility(
        &mut self,
        category_id: &CategoryID,
        switch: bool
    ) -> Result<(), SetCategoryVisibilityError> {
        if let Some(category) = self.categories.get_mut(category_id) {
            category.active = switch;
            Ok(())
        } else {
            Err(SetCategoryVisibilityError::CategoryNotFound)
        }
    }

    pub fn update_collection_category(
        &mut self,
        collection_canister_id: Principal,
        new_category_id: CategoryID
    ) -> Result<(), UpdateCollectionCategoryError> {
        if let Some(mut collection) = self.collections.get(&collection_canister_id) {
            let old_category_id = collection.category.clone();

            // check the old category exists
            if let Some(old_cat_id) = &old_category_id {
                if let None = self.categories.get(&old_cat_id) {
                    return Err(
                        UpdateCollectionCategoryError::CategoryNotFound(
                            format!(
                                "Can't update collection because the old category of id : {old_cat_id} does not exist"
                            )
                        )
                    );
                };
            }

            // check the new category exists
            if let None = self.categories.get(&new_category_id) {
                return Err(
                    UpdateCollectionCategoryError::CategoryNotFound(
                        format!(
                            "Can't update collection because the new category of id : {new_category_id} does not exist"
                        )
                    )
                );
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
            if let Some(category) = self.categories.get_mut(&new_category_id) {
                collection.category = Some(new_category_id.clone());

                self.collections.remove(&collection.canister_id);
                self.collections.insert(collection_canister_id, collection);

                category.collection_count += 1;
            }

            Ok(())
        } else {
            Err(UpdateCollectionCategoryError::CollectionNotFound)
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
            collection.category = Some(category_id);
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
            0 => {
                match self.collections.len().checked_div(limit as u64) {
                    Some(pages) => {
                        if pages == 0 { 1 } else { pages }
                    }
                    None => 1,
                }
            }
            _ => {
                let total_cols: u64 = cats
                    .iter()
                    .map(|(_, cat)| cat.collection_count)
                    .sum();

                match total_cols.checked_div(limit as u64) {
                    Some(pages) => {
                        if pages == 0 { 1 } else { pages }
                    }
                    None => 1,
                }
            }
        };

        // collect array of collections
        let mut cols: Vec<Collection> = self.collections
            .iter()
            .map(|(prin, col)| col.clone())
            .collect();

        // make sure promoted are first
        cols.sort_by(|a, b| b.is_promoted.cmp(&a.is_promoted));

        // apply pagination and category filtering
        let collections: Vec<Collection> = cols
            .into_iter()
            .filter(|collection| {
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
            .collect();

        Ok(GetCollectionsResult {
            collections,
            total_pages,
        })
    }

    pub fn search_collections(
        &self,
        categories: Option<Vec<u64>>,
        search_query: String,
        offset: usize,
        limit: usize
    ) -> SearchCollectionsResponse {
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

        // collect array of collections
        let mut cols: Vec<Collection> = self.collections
            .iter()
            .map(|(prin, col)| col.clone())
            .collect();

        // make sure promoted are first
        cols.sort_by(|a, b| b.is_promoted.cmp(&a.is_promoted));

        // apply pagination and category filtering
        let collections: Vec<Collection> = cols
            .into_iter()
            .filter(|collection| {
                match cat_ids.len() {
                    0 => { check_search_hit(&collection.name, &search_query) }
                    _ => {
                        if let Some(collection_cat_id) = collection.category {
                            cat_ids.contains(&&collection_cat_id) &&
                                check_search_hit(&collection.name, &search_query)
                        } else {
                            false
                        }
                    }
                }
            })
            .collect();

        let total_pages = match (collections.len().clone() as u64).checked_div(limit as u64) {
            Some(pages) => {
                if pages == 0 { 1 } else { pages }
            }
            None => 1,
        };

        let collections: Vec<Collection> = collections
            .into_iter()
            .skip(offset)
            .take(limit)
            .collect();

        SearchCollectionsResponse {
            collections,
            total_pages,
        }
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

    pub fn get_all_collections(&self) -> Vec<Collection> {
        self.collections
            .iter()
            .map(|(prin, collection)| collection)
            .collect()
    }

    pub fn get_collection_by_key(
        &self,
        canister_id: Principal
    ) -> Result<Collection, GetCollectionByPrincipal> {
        match self.collections.get(&canister_id) {
            Some(collection) => Ok(collection),
            None => { Err(GetCollectionByPrincipal::CollectionNotFound) }
        }
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
