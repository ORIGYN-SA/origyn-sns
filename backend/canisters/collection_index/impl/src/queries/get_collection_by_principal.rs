use crate::state::mutate_state;
use bity_ic_canister_tracing_macros::trace;
pub use collection_index_api::get_collection_by_principal::{
    Args as GetCollectionByPrincipalArg, Response as GetCollectionByPrincipalResponse,
};
use ic_cdk::query;

#[query]
#[trace]
pub async fn get_collection_by_principal(
    args: GetCollectionByPrincipalArg,
) -> GetCollectionByPrincipalResponse {
    mutate_state(|state| state.data.collections.get_collection_by_key(args))
}
