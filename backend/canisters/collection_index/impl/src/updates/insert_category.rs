use canister_tracing_macros::trace;
pub use collection_index_api::insert_category::{
    Args as InsertCategoryArgs,
    Response as InsertCategoryResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn insert_category(args: InsertCategoryArgs) -> InsertCategoryResponse {
    mutate_state(|state| { state.data.collections.insert_category(args.category_name) })
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn insert_category_validate(args: InsertCategoryArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
