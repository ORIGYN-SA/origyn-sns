use candid::CandidType;
use serde::{ Deserialize, Serialize };
use crate::{ category::CategoryID, errors::SetCategoryVisibilityError };

pub type Args = SetCategoryVisibility;
pub type Response = Result<(), SetCategoryVisibilityError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SetCategoryVisibility {
    pub category_id: CategoryID,
    pub hidden: bool,
}
