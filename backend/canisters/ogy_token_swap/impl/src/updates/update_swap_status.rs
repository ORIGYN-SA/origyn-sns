use ic_cdk::update;
use ic_ledger_types::BlockIndex;
use ogy_token_swap_api::token_swap::SwapStatus;

pub use ogy_token_swap_api::updates::update_swap_status::{
    Args as UpdateSwapStateArgs,
    Response as UpdateSwapStateResponse,
};

use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

// only to be used for integration testing
#[cfg(feature = "inttest")]
#[update(guard = "caller_is_authorised_principal", hidden = true)]
pub async fn update_swap_status(args: UpdateSwapStateArgs) -> UpdateSwapStateResponse {
    _update_swap_status_impl(args.block_index, args.swap_status).await
}

async fn _update_swap_status_impl(block_index: BlockIndex, swap_status: SwapStatus) {
    mutate_state(|s| { s.data.token_swap.update_status(block_index, swap_status.clone()) });
}
