use candid::CandidType;
use serde::{ Deserialize, Serialize };
use crate::errors::SetCategoryVisibilityError;

pub type Args = SetCategoryVisibility;
pub type Response = Result<(), SetCategoryVisibilityError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SetCategoryVisibility {
    pub category_name: String,
    pub hidden: bool,
}
