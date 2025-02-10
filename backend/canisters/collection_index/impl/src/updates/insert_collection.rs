use canister_tracing_macros::trace;
use collection_index_api::collection::Collection;
pub use collection_index_api::insert_collection::{
    Args as InsertCollectionArgs,
    Response as InsertCollectionResponse,
};
use ic_cdk::{ query, update };
use crate::{
    guards::caller_is_authorised_principal,
    services::origyn_nft::get_collection_info,
    state::mutate_state,
};

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn insert_collection(args: InsertCollectionArgs) -> InsertCollectionResponse {
    let mut collection: Collection = get_collection_info(args.collection_canister_id).await?.into();
    collection.locked_value_usd = args.locked_value_usd;
    collection.is_promoted = args.is_promoted;
    collection.canister_id = args.collection_canister_id;

    mutate_state(|state|
        state.data.collections.insert_collection(
            args.collection_canister_id,
            &mut collection,
            args.category
        )
    )
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn insert_collection_validate(args: InsertCollectionArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
