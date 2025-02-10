use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::UpdateCollectionError;
pub type Args = UpdateCollectionArgs;
pub type Response = Result<(), UpdateCollectionError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct UpdateCollectionArgs {
    pub collection_canister_id: Principal,
    pub category_name: Option<String>,
    pub locked_value_usd: Option<u64>,
}
