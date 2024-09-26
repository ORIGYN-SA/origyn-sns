use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::{ collection::Collection, errors::GetCollectionsError };

pub type Args = GetCollectionsArgs;
pub type Response = Result<Vec<Collection>, GetCollectionsError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetCollectionsArgs {
    pub category: Option<String>,
    pub offset: usize,
    pub limit: usize,
}
