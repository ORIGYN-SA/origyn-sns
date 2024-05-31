use std::collections::HashSet;

use candid::Principal;
use ic_cdk::update;

pub use ogy_token_swap_api::updates::update_white_list_principals::{
    Args as UpdateWhiteListArgs,
    Response as UpdateWhiteListResponse,
};

use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

// only to be used for integration testing
#[cfg(feature = "inttest")]
#[update(guard = "caller_is_authorised_principal", hidden = true)]
pub async fn update_white_list_principals(args: UpdateWhiteListArgs) -> UpdateWhiteListResponse {
    _update_white_list_principals_impl(args).await
}

async fn _update_white_list_principals_impl(white_list: HashSet<Principal>) {
    mutate_state(|s| {
        s.data.whitelisted_principals = white_list;
    });
}
