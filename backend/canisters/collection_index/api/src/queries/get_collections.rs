use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::collection::Collection;

pub type Args = GetCollectionsArgs;
pub type Response = Result<Vec<Collection>, String>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetCollectionsArgs {
    pub offset: usize,
    pub limit: usize,
}
