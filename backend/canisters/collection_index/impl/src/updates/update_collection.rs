use canister_tracing_macros::trace;
pub use collection_index_api::update_collection::{
    Args as UpdateCollectionArgs,
    Response as UpdateCollectionResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn update_collection_category(args: UpdateCollectionArgs) -> UpdateCollectionResponse {
    mutate_state(|state| {
        state.data.collections.update_collection(
            args.collection_canister_id,
            args.category_name,
            args.locked_value_usd
        )
    })
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn update_collection_category_validate(args: UpdateCollectionArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
