use canister_tracing_macros::trace;
pub use collection_index_api::update_collection_category::{
    Args as UpdateCollectionCategoryArgs,
    Response as UpdateCollectionCategoryResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn update_collection_category(
    args: UpdateCollectionCategoryArgs
) -> UpdateCollectionCategoryResponse {
    mutate_state(|state| {
        state.data.collections.update_collection_category(
            args.collection_canister_id,
            args.category_id
        )
    })
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn set_category_visibility_validate(
    args: UpdateCollectionCategoryArgs
) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
