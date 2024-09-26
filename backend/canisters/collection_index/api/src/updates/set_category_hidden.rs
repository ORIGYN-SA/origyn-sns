use candid::CandidType;
use serde::{ Deserialize, Serialize };
use crate::errors::SetCategoryHiddenError;

pub type Args = SetCategoryHiddenArgs;
pub type Response = Result<bool, SetCategoryHiddenError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SetCategoryHiddenArgs {
    pub category_name: String,
    pub hidden: bool,
}
