use candid::CandidType;
use serde::{ Deserialize, Serialize };
use crate::collection::Collection;

pub type Args = SearchCollectionsArg;
pub type Response = SearchCollectionsResponse;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SearchCollectionsArg {
    pub categories: Option<Vec<String>>,
    pub search_string: String,
    pub offset: usize,
    pub limit: usize,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SearchCollectionsResponse {
    pub collections: Vec<Collection>,
    pub total_pages: u64,
}
