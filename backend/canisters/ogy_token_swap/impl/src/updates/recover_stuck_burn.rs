use crate::{ state::{ mutate_state, read_state }, transfer_new_token };
use canister_tracing_macros::trace;
use ic_cdk::update;
use ic_ledger_types::{
    query_archived_blocks,
    query_blocks,
    ArchivedBlockRange,
    Block,
    BlockIndex,
    GetBlocksArgs,
    Operation,
};
use ledger_utils::principal_to_legacy_account_id;
use ogy_token_swap_api::token_swap::BurnRequestArgs;
use utils::env::Environment;

pub use ogy_token_swap_api::{
    updates::recover_stuck_burn::{
        Args as RecoverStuckBurnArgs,
        Response as RecoverStuckBurnResponse,
    },
    types::token_swap::{
        BlockFailReason,
        BurnFailReason,
        ImpossibleErrorReason,
        RecoverMode,
        SwapError,
        SwapStatus,
        TransferFailReason,
    },
};

#[update]
#[trace]
pub async fn recover_stuck_burn(args: RecoverStuckBurnArgs) -> RecoverStuckBurnResponse {
    match recover_stuck_burn_impl(args.block_index, args.block_index_burn).await {
        Ok(_) => RecoverStuckBurnResponse::Success,
        Err(err) => err,
    }
}

pub(crate) async fn recover_stuck_burn_impl(
    block_index: BlockIndex,
    block_index_burn: BlockIndex
) -> Result<(), RecoverStuckBurnResponse> {
    // 1. Check that block is actually stuck in burn mode
    let validation_data = mutate_state(|s| s.data.token_swap.recover_stuck_burn(block_index))?;
    // 2. Validate that block is a valid burn block
    validate_burn_block(block_index_burn, validation_data).await?;
    // 3. transfer new token to user
    transfer_new_token(block_index).await.map_err(|err|
        RecoverStuckBurnResponse::FinalTransferFailed(err)
    )
}

async fn validate_burn_block(
    block_index_burn: BlockIndex,
    validation_data: BurnRequestArgs
) -> Result<(), RecoverStuckBurnResponse> {
    let ogy_legacy_ledger_canister_id = read_state(|s| s.data.canister_ids.ogy_legacy_ledger);

    match
        query_blocks(ogy_legacy_ledger_canister_id, GetBlocksArgs {
            start: block_index_burn,
            length: 1,
        }).await
    {
        Ok(block_data) => {
            // Two valid cases: either the block is in the ledger or it is in the archive canister
            // 1. If it is there, it is directly analysed
            // 2. If it is too old, it will be searched for in the archive canister
            // Otherwise it is marked as not found.
            if !block_data.blocks.is_empty() {
                verify_burn_block_data(&block_data.blocks[0], validation_data)
            } else if !block_data.archived_blocks.is_empty() {
                process_archive_block(&block_data.archived_blocks[0], validation_data).await
            } else {
                Err(RecoverStuckBurnResponse::BurnBlockNotFound)
            }
        }
        Err((_, err)) => {
            Err(
                RecoverStuckBurnResponse::InternalError(
                    format!("System error when fetching burn block. Retry. Message: {err}")
                )
            )
        }
    }
}

pub fn verify_burn_block_data(
    block: &Block,
    validation_data: BurnRequestArgs
) -> Result<(), RecoverStuckBurnResponse> {
    let ogy_token_swap_canister_id = read_state(|s| s.env.canister_id());
    // There is always exactly 1 transaction per block
    match block.transaction.operation {
        Some(Operation::Burn { from, amount }) => {
            let expected_sender = principal_to_legacy_account_id(
                ogy_token_swap_canister_id,
                validation_data.from_subaccount
            );
            let expected_amount = validation_data.amount;
            let expected_memo = validation_data.memo;
            let expected_time = validation_data.created_at_time;
            if from != expected_sender {
                return Err(
                    RecoverStuckBurnResponse::NotAValidBurnBlock(
                        format!(
                            "Sending account doesn't match. Expected: {expected_sender}, found: {from}."
                        )
                    )
                );
            } else if amount != expected_amount {
                return Err(
                    RecoverStuckBurnResponse::NotAValidBurnBlock(
                        format!(
                            "Sending amount doesn't match. Expected: {expected_amount}, found: {amount}."
                        )
                    )
                );
            } else if block.transaction.memo != expected_memo {
                return Err(
                    RecoverStuckBurnResponse::NotAValidBurnBlock(
                        format!(
                            "Sending memo doesn't match. Expected: {:?}, found: {:?}.",
                            expected_memo,
                            block.transaction.memo
                        )
                    )
                );
            } else if Some(block.transaction.created_at_time) != expected_time {
                return Err(
                    RecoverStuckBurnResponse::NotAValidBurnBlock(
                        format!(
                            "Sending created_at_time doesn't match. Expected: {:?}, found: {:?}.",
                            expected_time,
                            block.transaction.created_at_time
                        )
                    )
                );
            }
            Ok(())
        }
        _ => Err(RecoverStuckBurnResponse::NotAValidBurnBlock("Not a burn block.".to_string())),
    }
}

async fn process_archive_block(
    archive_block_range: &ArchivedBlockRange,
    validation_data: BurnRequestArgs
) -> Result<(), RecoverStuckBurnResponse> {
    match
        query_archived_blocks(&archive_block_range.callback, GetBlocksArgs {
            start: archive_block_range.start,
            length: archive_block_range.length,
        }).await
    {
        Ok(Ok(block_range)) => {
            if !block_range.blocks.is_empty() {
                verify_burn_block_data(&block_range.blocks[0], validation_data)
            } else {
                Err(RecoverStuckBurnResponse::BurnBlockNotFound)
            }
        }
        _ =>
            Err(
                RecoverStuckBurnResponse::InternalError(
                    format!("System error when fetching burn block from archive canister. Retry.")
                )
            ),
    }
}
