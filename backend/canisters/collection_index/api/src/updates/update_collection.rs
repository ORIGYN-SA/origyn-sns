use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

use crate::errors::UpdateCollectionError;
pub type Args = UpdateCollectionArgs;
pub type Response = Result<(), UpdateCollectionError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct UpdateCollectionArgs {
    pub collection_canister_id: Principal,
    pub category_name: Option<String>,
    // fixed TVL override, moves the collection to arbitrary_collections_tvl
    pub locked_value_usd: Option<u64>,
    // per-item price, moves the collection to collections. mutually exclusive with locked_value_usd
    pub item_price_usd: Option<u64>,
}
