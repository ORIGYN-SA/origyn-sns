use canister_tracing_macros::trace;
use collection_index_api::collection::GetCollectionsFilters;
pub use collection_index_api::get_collections::{
    Args as GetCollectionsArgs,
    Response as GetCollectionsResponse,
};
use ic_cdk::query;
use crate::state::mutate_state;

#[query]
#[trace]
pub async fn get_collections(args: GetCollectionsArgs) -> GetCollectionsResponse {
    Ok(
        mutate_state(|state|
            state.data.collections.get_collections(args.categories, args.offset, args.limit)
        )?
    )
}
