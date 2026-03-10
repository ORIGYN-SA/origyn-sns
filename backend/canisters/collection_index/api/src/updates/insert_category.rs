use crate::errors::InsertCategoryError;
use candid::CandidType;
use serde::{Deserialize, Serialize};

pub type Args = InsertCategoryArgs;
pub type Response = Result<(), InsertCategoryError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InsertCategoryArgs {
    pub category_name: String,
}
