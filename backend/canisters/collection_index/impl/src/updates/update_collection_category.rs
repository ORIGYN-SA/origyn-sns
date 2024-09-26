use canister_tracing_macros::trace;
pub use collection_index_api::update_collection_category::{
    Args as UpdateCollectionCategoryArgs,
    Response as UpdateCollectionCategoryResponse,
};
use ic_cdk::update;
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn update_collection_category(
    args: UpdateCollectionCategoryArgs
) -> UpdateCollectionCategoryResponse {
    Ok(
        mutate_state(|state| {
            state.data.collections.update_collection_category(
                args.collection_canister_id,
                args.new_category
            )
        })?
    )
}
