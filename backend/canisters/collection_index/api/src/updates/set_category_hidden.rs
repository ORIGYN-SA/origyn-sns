use candid::CandidType;
use serde::{ Deserialize, Serialize };
use crate::{ category::CategoryID, errors::SetCategoryHiddenError };

pub type Args = SetCategoryHiddenArgs;
pub type Response = Result<(), SetCategoryHiddenError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SetCategoryHiddenArgs {
    pub category_id: CategoryID,
    pub hidden: bool,
}
