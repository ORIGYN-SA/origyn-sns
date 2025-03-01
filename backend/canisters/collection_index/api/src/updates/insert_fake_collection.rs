use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::collection::Collection;

pub type Args = InsertFakeCollectionArgs;
pub type Response = Result<(), ()>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct InsertFakeCollectionArgs {
    pub collection: Collection,
    pub category: Option<String>,
}
