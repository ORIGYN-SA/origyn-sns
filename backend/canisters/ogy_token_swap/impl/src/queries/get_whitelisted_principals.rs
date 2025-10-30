use ic_cdk::query;
use ogy_token_swap_api::get_whitelisted_principals::Response;

use crate::{ guards::caller_is_authorised_principal, state::read_state };

#[query(guard = "caller_is_authorised_principal", hidden = true)]
async fn get_whitelisted_principals() -> Response {
    read_state(|s| { s.data.whitelisted_principals.clone().into_iter().collect() })
}
