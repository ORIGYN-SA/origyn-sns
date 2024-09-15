use canister_tracing_macros::trace;
pub use nft_index_api::add_authorised_principal::{
    Args as AddAuthorisedPrincipalArgs,
    Response as AddAuthorisedPrincipalResponse,
};
use ic_cdk::update;
use crate::{ guards::caller_is_authorised_principal, state::{ mutate_state, read_state } };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn add_authorised_principal(
    principal: AddAuthorisedPrincipalArgs
) -> AddAuthorisedPrincipalResponse {
    let authorised_principals = read_state(|state| state.data.authorised_principals.clone());

    if authorised_principals.contains(&principal) {
        return Err("Principal is already authorized.".to_string());
    }

    mutate_state(|state| {
        state.data.authorised_principals.push(principal);
    });

    Ok(true)
}
