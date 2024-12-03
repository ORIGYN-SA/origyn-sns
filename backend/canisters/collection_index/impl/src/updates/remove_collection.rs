use canister_tracing_macros::trace;
pub use collection_index_api::remove_collection::{
    Args as RemoveCollectionArgs,
    Response as RemoveCollectionResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn remove_collection(args: RemoveCollectionArgs) -> RemoveCollectionResponse {
    mutate_state(|state| state.data.collections.remove_collection(args.collection_canister_id))
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn remove_collection_validate(args: RemoveCollectionArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
