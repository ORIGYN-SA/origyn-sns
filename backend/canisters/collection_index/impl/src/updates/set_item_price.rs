use crate::{guards::caller_is_authorised_principal, state::mutate_state};
use bity_ic_canister_tracing_macros::trace;
pub use collection_index_api::set_item_price::{
    Args as SetItemPriceArgs, Response as SetItemPriceResponse,
};
use ic_cdk::update;

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn set_item_price(args: SetItemPriceArgs) -> SetItemPriceResponse {
    mutate_state(|state| {
        state
            .data
            .collections
            .update_price(args.collection_canister_id, Some(args.price_usd))
    })
}
