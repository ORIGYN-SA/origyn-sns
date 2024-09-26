use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::UpdateCollectionCategoryError;
pub type Args = UpdateCollectionCategoryArgs;
pub type Response = Result<bool, UpdateCollectionCategoryError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct UpdateCollectionCategoryArgs {
    pub collection_canister_id: Principal,
    pub new_category: String,
}
