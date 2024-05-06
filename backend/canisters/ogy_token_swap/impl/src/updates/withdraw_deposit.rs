use candid::CandidType;
use ic_cdk::update;
use ic_ledger_types::{ query_blocks, BlockIndex, GetBlocksArgs };

use crate::{ guards::caller_is_authorised_principal, state::read_state };

#[derive(CandidType)]
pub enum WithdrawDepositResponse {
    Success(BlockIndex),
    InternalError(String),
}

#[update(guard = "caller_is_authorised_principal", hidden = true)]
async fn withdraw_deposit(block_index_deposit: BlockIndex) -> WithdrawDepositResponse {
    match withdraw_deposit_impl(block_index_deposit).await {
        Ok(block_index_withdraw) => WithdrawDepositResponse::Success(block_index_withdraw),
        Err(err) => WithdrawDepositResponse::InternalError(err),
    }
}

async fn withdraw_deposit_impl(block_index: BlockIndex) -> Result<BlockIndex, String> {
    let ogy_legacy_ledger_canister_id = read_state(|s| s.data.canister_ids.ogy_legacy_ledger);
    match
        query_blocks(ogy_legacy_ledger_canister_id, GetBlocksArgs {
            start: block_index,
            length: 1,
        }).await
    {
        Ok(block) => (),
        _ => (),
    }
    // 2. validate
    Err("".to_string())
}
