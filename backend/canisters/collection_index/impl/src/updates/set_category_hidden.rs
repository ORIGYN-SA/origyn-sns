use canister_tracing_macros::trace;
pub use collection_index_api::set_category_hidden::{
    Args as SetCategoryHiddenArgs,
    Response as SetCategoryHiddenResponse,
};
use ic_cdk::update;
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn set_category_hidden(args: SetCategoryHiddenArgs) -> SetCategoryHiddenResponse {
    mutate_state(|state| {
        state.data.collections.set_category_inactive(&args.category_id, args.hidden)
    })
}
