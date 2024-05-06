use ic_cdk::query;
use ic_ledger_types::BlockIndex;

use crate::{ model::token_swap::SwapInfo, state::read_state };

#[query]
async fn get_swap_info(block_index: BlockIndex) -> Result<SwapInfo, String> {
    get_swap_info_impl(block_index)
}

fn get_swap_info_impl(block_index: BlockIndex) -> Result<SwapInfo, String> {
    read_state(|s| {
        match s.data.token_swap.get_swap_info(block_index) {
            Some(val) => Ok((*val).clone()),
            None => Err(format!("Block {block_index} not found.")),
        }
    })
}
