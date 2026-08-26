use crate::{guards::caller_is_authorised_principal, state::mutate_state};
use bity_ic_canister_tracing_macros::trace;
pub use collection_index_api::set_claimlink_canister_id::{
    Args as SetClaimlinkCanisterIdArgs, Response as SetClaimlinkCanisterIdResponse,
};
use ic_cdk::update;

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn set_claimlink_canister_id(
    args: SetClaimlinkCanisterIdArgs,
) -> SetClaimlinkCanisterIdResponse {
    mutate_state(|state| {
        state.data.claimlink_canister_id = args;
    })
}
