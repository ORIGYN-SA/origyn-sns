use candid::CandidType;
use serde::{ Deserialize, Serialize };
use crate::errors::InsertCategoryError;

pub type Args = InsertCategoryArgs;
pub type Response = Result<bool, InsertCategoryError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InsertCategoryArgs {
    pub category_name: String,
}
