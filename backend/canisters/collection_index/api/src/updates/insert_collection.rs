use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::InsertCollectionError;

pub type Args = InsertCollectionArgs;
pub type Response = Result<bool, InsertCollectionError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InsertCollectionArgs {
    pub collection_canister_id: Principal,
    pub is_promoted: bool,
}
