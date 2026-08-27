use crate::{guards::caller_is_authorised_principal, state::mutate_state};
use bity_ic_canister_tracing_macros::trace;
pub use collection_index_api::remove_item_price::{
    Args as RemoveItemPriceArgs, Response as RemoveItemPriceResponse,
};
use ic_cdk::update;

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn remove_item_price(args: RemoveItemPriceArgs) -> RemoveItemPriceResponse {
    mutate_state(|state| {
        state
            .data
            .collections
            .update_price(args.collection_canister_id, None);
    })
}
