use canister_tracing_macros::trace;
pub use collection_index_api::remove_category::{
    Args as RemoveCategoryArgs,
    Response as RemoveCategoryResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn remove_category(args: RemoveCategoryArgs) -> RemoveCategoryResponse {
    mutate_state(|state| state.data.collections.remove_category(args.category_name))
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn remove_category_validate(args: RemoveCategoryArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
