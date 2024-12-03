use canister_tracing_macros::trace;
pub use collection_index_api::set_category_visibility::{
    Args as SetCategoryVisibilityArgs,
    Response as SetCategoryVisibilityResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn set_category_visibility(args: SetCategoryVisibilityArgs) -> SetCategoryVisibilityResponse {
    mutate_state(|state| {
        state.data.collections.set_category_visibility(args.category_name, args.hidden)
    })
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn set_category_visibility_validate(
    args: SetCategoryVisibilityArgs
) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
