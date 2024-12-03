use canister_tracing_macros::trace;
pub use collection_index_api::get_categories::{
    Args as GetCategoriesArgs,
    Response as GetCategoriesResponse,
};
use ic_cdk::query;
use crate::state::mutate_state;

#[query]
#[trace]
pub async fn get_categories() -> GetCategoriesResponse {
    Ok(mutate_state(|state| state.data.collections.get_all_categories()))
}
