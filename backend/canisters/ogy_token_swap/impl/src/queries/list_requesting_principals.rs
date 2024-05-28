use std::collections::HashSet;

use candid::Principal;
use ic_cdk::query;

pub use ogy_token_swap_api::queries::list_requesting_principals::Response as GetSwapInfoResponse;

use crate::state::read_state;

#[query(hidden = true)]
async fn list_requesting_principals() -> GetSwapInfoResponse {
    list_requesting_principals_impl()
}

fn list_requesting_principals_impl() -> HashSet<Principal> {
    read_state(|s| s.data.requesting_principals.list())
}
