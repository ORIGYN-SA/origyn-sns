use crate::{
    model::token_swap::{BlockFailReason, SwapError, SwapStatus},
    state::{mutate_state, read_state},
};
use candid::{CandidType, Func, Nat, Principal};
use canister_tracing_macros::trace;
use ic_cdk::{api, update};
use ic_ledger_types::{
    query_archived_blocks, query_blocks, ArchivedBlockRange, Block, BlockIndex, GetBlocksArgs,
    Operation, QueryArchiveFn, Transaction,
};
use ledger_utils::principal_to_legacy_account_id;
use serde::{Deserialize, Serialize};
use tracing::error;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum SwapTokensResponse {
    Success,
    InternalError(String),
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SwapTokensRequest {
    block_index: BlockIndex,
    user: Option<Principal>,
}

#[trace]
#[update]
pub async fn swap_tokens(args: SwapTokensRequest) -> SwapTokensResponse {
    let user = match args.user {
        Some(p) => p,
        None => api::caller(),
    };
    match swap_tokens_impl(args.block_index, user).await {
        Ok(_) => SwapTokensResponse::Success,
        Err(err) => SwapTokensResponse::InternalError(err),
    }
}

pub(crate) async fn swap_tokens_impl(
    block_index: BlockIndex,
    principal: Principal,
) -> Result<(), String> {
    // 1. Initialise internal state and verify previous entries in case they are present
    let mode = mutate_state(|s| s.data.token_swap.init_swap(block_index, principal))?;
    // 2. validate block data
    let (ogy_ledger_canister_id, ogy_legacy_ledger_canister_id) = read_state(|s| {
        (
            s.data.canister_ids.ogy_ledger,
            s.data.canister_ids.ogy_legacy_ledger,
        )
    });

    match query_blocks(
        ogy_legacy_ledger_canister_id,
        GetBlocksArgs {
            start: block_index,
            length: 1,
        },
    )
    .await
    {
        Ok(block_data) => {
            // two cases: either block is there or it is too old
            if block_data.blocks.len() > 0 {
                analyse_block_data(&block_data.blocks[0], block_index, principal);
            } else if block_data.archived_blocks.len() > 0 {
                query_archive_block(&block_data.archived_blocks[0], block_index, principal);
            } else {
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound)),
                    )
                });
            }
        }
        Err((_, err)) => {
            error!("Failed to request block info for block index {block_index}. Message: {err}");
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::QueryRequestFailed)),
                )
            });
        }
    };
    Ok(())
}

pub fn analyse_block_data(block: &Block, block_index: BlockIndex, principal: Principal) {
    // There is always exactly 1 transaction per block
    match block.transaction.operation {
        Some(Operation::Transfer {
            from,
            to,
            amount,
            fee: _,
        }) => {
            if to != principal_to_legacy_account_id(api::id(), None) {
                // The tokens have to have been sent from the default subaccount of the defined principal
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(
                            BlockFailReason::ReceiverNotSwapCanister,
                        )),
                    )
                });
            } else if from != principal_to_legacy_account_id(principal, None) {
                // The tokens have to have been sent to the swap canister
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(
                            BlockFailReason::SenderNotPrincipalDefaultSubaccount(from),
                        )),
                    )
                });
            } else {
                // This is the happy path if the two conditions above are fulfilled
                mutate_state(|s| {
                    s.data
                        .token_swap
                        .set_amount(block_index, Nat::from(amount.e8s()));
                    s.data
                        .token_swap
                        .update_status(block_index, SwapStatus::BlockValid);
                })
            }
        }
        _ => mutate_state(|s| {
            s.data.token_swap.update_status(
                block_index,
                SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::InvalidOperation)),
            )
        }),
    }
}

async fn query_archive_block(
    archive_block_range: &ArchivedBlockRange,
    block_index: BlockIndex,
    principal: Principal,
) {
    // let ogy_legacy_ledger_archive_canister_id = read_state(|s| {
    //     s.data.canister_ids.ogy_legacy_ledger_archive
    // });
    // let func = QueryArchiveFn::from(Func {
    //     principal: ogy_legacy_ledger_archive_canister_id,
    //     method: "get_blocks".to_string(),
    // });
    match query_archived_blocks(
        &archive_block_range.callback,
        GetBlocksArgs {
            start: archive_block_range.start,
            length: archive_block_range.length,
        },
    )
    .await
    {
        Ok(blocks) => (),
        Err(_) => (),
    };
}
