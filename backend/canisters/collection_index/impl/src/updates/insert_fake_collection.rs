#![allow(dead_code)] // Ignore warnings for unused code (functions, structs, etc.)
#![allow(unused_imports)] // Ignore warnings for unused imports
#![allow(unused_variables)] // Ignore warnings for unused variables
#![allow(unused_mut)] // Ignore warnings for unused mutable variables
#![allow(unused_macros)]

use canister_tracing_macros::trace;
use collection_index_api::collection::Collection;
pub use collection_index_api::insert_fake_collection::{
    Args as InsertFakeCollectionArgs,
    Response as InsertFakeCollectionResponse,
};
use ic_cdk::update;
use crate::{
    guards::caller_is_authorised_principal,
    services::origyn_nft::get_collection_info,
    state::mutate_state,
};

#[cfg(feature = "inttest")]
#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn insert_fake_collection(
    args: InsertFakeCollectionArgs
) -> InsertFakeCollectionResponse {
    mutate_state(|state| {
        let mut collection = args.collection.clone();
        state.data.collections.insert_collection(
            args.collection.canister_id,
            &mut collection,
            args.category
        );
    });
    Ok(())
}
