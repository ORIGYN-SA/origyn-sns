use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::{ collection::Collection, errors::GetCollectionsError };

pub type Args = GetCollectionsArgs;
pub type Response = Result<GetCollectionsResult, GetCollectionsError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetCollectionsArgs {
    pub categories: Option<Vec<String>>,
    pub offset: usize,
    pub limit: usize,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetCollectionsResult {
    pub collections: Vec<Collection>,
    pub total_pages: u64,
}
