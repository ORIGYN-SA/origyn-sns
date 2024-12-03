use canister_tracing_macros::trace;
pub use collection_index_api::toggle_promoted::{
    Args as TogglePromotedArgs,
    Response as TogglePromotedResponse,
};
use ic_cdk::{ query, update };
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn toggle_promoted(args: TogglePromotedArgs) -> TogglePromotedResponse {
    mutate_state(|state| { state.data.collections.toggle_promoted(args.collection_canister_id) })
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn toggle_promoted_validate(args: TogglePromotedArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
