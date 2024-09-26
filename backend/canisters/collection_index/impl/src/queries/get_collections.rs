use canister_tracing_macros::trace;
pub use collection_index_api::get_collections::{
    Args as GetCollectionsArgs,
    Response as GetCollectionsResponse,
};
use ic_cdk::query;
use crate::state::mutate_state;

#[query]
#[trace]
pub async fn get_collections(args: GetCollectionsArgs) -> GetCollectionsResponse {
    match args.category {
        Some(category) =>
            Ok(
                mutate_state(|state|
                    state.data.collections.get_collections_by_category(
                        category,
                        args.offset,
                        args.limit
                    )
                )
            )?,
        None =>
            Ok(
                mutate_state(|state|
                    state.data.collections.get_all_collections(args.offset, args.limit)
                )
            )?,
    }
}
