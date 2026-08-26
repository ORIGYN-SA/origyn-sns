use crate::{guards::caller_is_authorised_principal, state::read_state};
use bity_ic_canister_tracing_macros::trace;
pub use collection_index_api::get_item_prices::{
    Args as GetItemPricesArgs, Response as GetItemPricesResponse,
};
use ic_cdk::query;

#[query(guard = "caller_is_authorised_principal")]
#[trace]
pub fn get_item_prices() -> GetItemPricesResponse {
    read_state(|state| {
        state
            .data
            .item_prices_usd
            .iter()
            .map(|(canister_id, price_usd)| (*canister_id, *price_usd))
            .collect()
    })
}
