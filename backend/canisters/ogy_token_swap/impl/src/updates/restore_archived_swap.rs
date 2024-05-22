use ic_cdk::update;
use ic_ledger_types::BlockIndex;
use ogy_token_swap_api::token_swap::SwapStatus;

pub use ogy_token_swap_api::updates::restore_archived_swap::{
    Args as RestoreSwapArgs,
    Response as RestoreSwapResponse,
};

use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

// only to be used for integration testing
#[cfg(feature = "inttest")]
#[update(guard = "caller_is_authorised_principal", hidden = true)]
pub async fn restore_archived_swap(args: RestoreSwapArgs) -> RestoreSwapResponse {
    _restore_archived_swap_impl(args.block_index).await
}

async fn _restore_archived_swap_impl(block_index: BlockIndex) {
    mutate_state(|s| { s.data.token_swap._restore_archived_swap(block_index) });
}
