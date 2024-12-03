use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::errors::RemoveCategoryError;

pub type Args = RemoveCategoryArgs;
pub type Response = Result<(), RemoveCategoryError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct RemoveCategoryArgs {
    pub category_name: String,
}
