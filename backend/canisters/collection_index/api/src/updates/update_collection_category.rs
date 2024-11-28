use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::UpdateCollectionCategoryError;
pub type Args = UpdateCollectionCategoryArgs;
pub type Response = Result<(), UpdateCollectionCategoryError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct UpdateCollectionCategoryArgs {
    pub collection_canister_id: Principal,
    pub category_name: String,
}
