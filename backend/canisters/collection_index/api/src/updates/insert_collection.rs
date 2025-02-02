use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::InsertCollectionError;

pub type Args = InsertCollectionArgs;
pub type Response = Result<(), InsertCollectionError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InsertCollectionArgs {
    pub collection_canister_id: Principal,
    pub is_promoted: bool,
    pub category: Option<String>,
    pub locked_value_usd: Option<u64>,
}
