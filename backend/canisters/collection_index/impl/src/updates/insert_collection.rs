use canister_tracing_macros::trace;
use collection_index_api::collection::Collection;
pub use collection_index_api::insert_collection::{
    Args as InsertCollectionArgs,
    Response as InsertCollectionResponse,
};
use ic_cdk::update;
use crate::{
    guards::caller_is_authorised_principal,
    services::origyn_nft::get_collection_info,
    state::mutate_state,
};

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn insert_collection(args: InsertCollectionArgs) -> InsertCollectionResponse {
    let mut collection: Collection = get_collection_info(args.collection_canister_id).await?.into();
    collection.is_promoted = args.is_promoted;
    collection.canister_id = args.collection_canister_id;

    Ok(
        mutate_state(|state|
            state.data.collections.insert_collection(
                args.collection_canister_id,
                &collection,
                args.category
            )
        )?
    )
}
