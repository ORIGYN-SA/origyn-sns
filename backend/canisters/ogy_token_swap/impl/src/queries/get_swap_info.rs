use ic_cdk::query;
use ic_ledger_types::BlockIndex;

pub use ogy_token_swap_api::queries::get_swap_info::{
    Args as GetSwapInfoArgs,
    Response as GetSwapInfoResponse,
};
use ogy_token_swap_api::token_swap::SwapInfo;

use crate::state::read_state;

#[query]
async fn get_swap_info(args: GetSwapInfoArgs) -> GetSwapInfoResponse {
    match get_swap_info_impl(args.block_index) {
        Ok(val) => GetSwapInfoResponse::Success(val),
        Err(err) => GetSwapInfoResponse::InternalError(err),
    }
}

fn get_swap_info_impl(block_index: BlockIndex) -> Result<SwapInfo, String> {
    read_state(|s| {
        match s.data.token_swap.get_swap_info(block_index) {
            Some(val) => Ok(val),
            None => Err(format!("Block {block_index} not found.")),
        }
    })
}
