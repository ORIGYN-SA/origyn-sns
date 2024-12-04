use canister_tracing_macros::trace;
pub use collection_index_api::{
    search_collections::{ Args as SearchCollectionsArg, Response as SearchCollectionsResponse },
};
pub use collection_index_api::get_collections::{
    Args as GetCollectionsArgs,
    Response as GetCollectionsResponse,
};
use ic_cdk::query;
use crate::state::read_state;

#[query]
#[trace]
pub fn search_collections(args: SearchCollectionsArg) -> SearchCollectionsResponse {
    read_state(|state|
        state.data.collections.search_collections(
            args.categories,
            args.search_string,
            args.offset,
            args.limit
        )
    )
}
