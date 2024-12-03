use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::RemoveCollectionError;

pub type Args = RemoveCollectionArgs;
pub type Response = Result<(), RemoveCollectionError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct RemoveCollectionArgs {
    pub collection_canister_id: Principal,
}
