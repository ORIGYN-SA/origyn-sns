use crate::{
    model::token_swap::{
        BlockFailReason, BurnFailReason, ImpossibleErrorReason, RecoverMode, SwapError, SwapStatus,
        TransferFailReason,
    },
    state::{mutate_state, read_state},
};
use candid::{CandidType, Nat, Principal};
use canister_tracing_macros::trace;
use ic_cdk::update;
use ic_ledger_types::{
    query_archived_blocks, query_blocks, transfer, ArchivedBlockRange, Block, BlockIndex,
    GetBlocksArgs, Memo, Operation, Subaccount, Tokens, TransferArgs,
};
use icrc_ledger_canister_c2c_client::icrc1_transfer;
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{Memo as MemoIcrc, TransferArg},
};
use ledger_utils::principal_to_legacy_account_id;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use utils::{consts::E8S_FEE_OGY, env::Environment};

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
    let caller = read_state(|s| s.env.caller());
    let user = match args.user {
        Some(p) => p,
        None => caller,
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
    let recover_mode = mutate_state(|s| s.data.token_swap.init_swap(block_index, principal))?;
    match recover_mode {
        None | Some(RecoverMode::RetryBlockValidation) => {
            // 2. validate block data
            validate_block(block_index, principal).await?;
            // 3. burn old token
            burn_token(block_index).await?;
            // 4. transfer new token to user
            transfer_new_token(block_index).await
        }
        Some(RecoverMode::RetryBurn) => {
            // 3. burn old token
            burn_token(block_index).await?;
            // 4. transfer new token to user
            transfer_new_token(block_index).await
        }
        Some(RecoverMode::RetryTransfer) => {
            // 4. transfer new token to user
            transfer_new_token(block_index).await
        }
    }
}

async fn validate_block(block_index: BlockIndex, principal: Principal) -> Result<(), String> {
    let ogy_legacy_ledger_canister_id = read_state(|s| s.data.canister_ids.ogy_legacy_ledger);

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
            // Two valid cases: either the block is in the ledger or it is in the archive canister
            // 1. If it is there, it is directly analysed
            // 2. If it is too old, it will be searched for in the archive canister
            // Otherwise it is marked as not found.
            if block_data.blocks.len() > 0 {
                verify_block_data(&block_data.blocks[0], block_index, principal)
            } else if block_data.archived_blocks.len() > 0 {
                process_archive_block(&block_data.archived_blocks[0], block_index, principal).await
            } else {
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound)),
                    )
                });
                Err(format!("Block index {block_index} not found."))
            }
        }
        Err((_, err)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::QueryRequestFailed)),
                )
            });
            Err(format!(
                "Failed to request block info for block index {block_index}. Message: {err}"
            ))
        }
    }
}

pub fn verify_block_data(
    block: &Block,
    block_index: BlockIndex,
    principal: Principal,
) -> Result<(), String> {
    // There is always exactly 1 transaction per block
    match block.transaction.operation {
        Some(Operation::Transfer {
            from,
            to,
            amount,
            fee: _,
        }) => {
            let expected_subaccount = Subaccount::from(principal);
            let expected_account_id = principal_to_legacy_account_id(
                read_state(|s| s.env.canister_id()),
                Some(expected_subaccount),
            );
            if to != expected_account_id {
                // The tokens have to have been sent to the swap canister with a subaccount that is equal to the
                // sending principal
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(
                            BlockFailReason::ReceiverNotCorrectAccountId(expected_subaccount),
                        )),
                    )
                });
                return Err(format!("Receiving account for principal {principal} is not the correct account id. Expected {expected_account_id}, found {to}"));
            } else if from != principal_to_legacy_account_id(principal, None) {
                // The tokens have to have been sent from the default subaccount of the defined principal
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(
                            BlockFailReason::SenderNotPrincipalDefaultSubaccount(from),
                        )),
                    )
                });
                return Err(format!(
                    "Sending account is not default subaccount of principal {principal}."
                ));
            } else if amount == Tokens::from_e8s(0) {
                // The amount has to be greated than 0 to conduct a swap.
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::ZeroAmount)),
                    )
                });
                return Err(format!("Number of tokens in block is zero."));
            } else {
                // This is the happy path if the conditions above are fulfilled
                mutate_state(|s| {
                    s.data.token_swap.set_amount(block_index, amount);
                    s.data
                        .token_swap
                        .update_status(block_index, SwapStatus::BlockValid);
                })
            }
            Ok(())
        }
        _ => mutate_state(|s| {
            s.data.token_swap.update_status(
                block_index,
                SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::InvalidOperation)),
            );
            Err(format!("Operation in block is not a valid transfer."))
        }),
    }
}

async fn process_archive_block(
    archive_block_range: &ArchivedBlockRange,
    block_index: BlockIndex,
    principal: Principal,
) -> Result<(), String> {
    match query_archived_blocks(
        &archive_block_range.callback,
        GetBlocksArgs {
            start: archive_block_range.start,
            length: archive_block_range.length,
        },
    )
    .await
    {
        Ok(Ok(block_range)) => {
            if block_range.blocks.len() > 0 {
                verify_block_data(&block_range.blocks[0], block_index, principal)
            } else {
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound)),
                    );
                });
                Err(format!(
                    "Block {block_index} not found in archive canister."
                ))
            }
        }
        _ => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound)),
                );
            });
            Err(format!(
                "Block {block_index} not found in archive canister."
            ))
        }
    }
}

async fn burn_token(block_index: BlockIndex) -> Result<(), String> {
    let (amount, principal_result, ogy_legacy_ledger_canister_id, ogy_legacy_minting_account) =
        read_state(|s| {
            (
                s.data.token_swap.get_amount(block_index),
                s.data.token_swap.get_principal(block_index),
                s.data.canister_ids.ogy_legacy_ledger,
                s.data.minting_account,
            )
        });
    let principal: Principal;
    if let Ok(p) = principal_result {
        principal = p;
    } else {
        mutate_state(|s| {
            s.data.token_swap.update_status(
                block_index,
                SwapStatus::Failed(SwapError::UnexpectedError(
                    ImpossibleErrorReason::PrincipalNotFound,
                )),
            );
        });
        return Err(format!(
            "Principal not found in internal token_swap list for block {block_index}."
        ));
    }
    if amount == Tokens::from_e8s(0) {
        // This was already checked above when the block was analysed but checking again to be sure.
        return Err("Zero tokens cannot be swap.".to_string());
    }
    let args = TransferArgs {
        memo: Memo(block_index),
        to: ogy_legacy_minting_account,
        amount,
        fee: Tokens::from_e8s(E8S_FEE_OGY),
        from_subaccount: Some(Subaccount::from(principal)),
        created_at_time: None,
    };
    match transfer(ogy_legacy_ledger_canister_id, args).await {
        Ok(Ok(burn_block_index)) => {
            mutate_state(|s| {
                s.data
                    .token_swap
                    .set_burn_block_index(block_index, burn_block_index);
                s.data
                    .token_swap
                    .update_status(block_index, SwapStatus::BurnSuccess);
            });
            Ok(())
        }
        Ok(Err(msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BurnFailed(BurnFailReason::TransferError(
                        msg.clone(),
                    ))),
                )
            });
            Err(format!(
                "Token burn failed due to transfer error. Message: {msg}"
            ))
        }
        Err((_, msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BurnFailed(BurnFailReason::CallError(
                        msg.clone(),
                    ))),
                )
            });
            Err(format!(
                "Token burn failed due to call error. Message: {msg}"
            ))
        }
    }
}

async fn transfer_new_token(block_index: BlockIndex) -> Result<(), String> {
    let (amount, ogy_ledger_canister_id, principal_result) = read_state(|s| {
        (
            s.data.token_swap.get_amount(block_index),
            s.data.canister_ids.ogy_new_ledger,
            s.data.token_swap.get_principal(block_index),
        )
    });
    let principal = principal_result?;
    if amount == Tokens::from_e8s(0) {
        // This was already checked above when the block was analysed but checking again to be sure.
        return Err("Zero tokens cannot be swap.".to_string());
    }
    let args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: principal,
            subaccount: None,
        },
        amount: Nat::from(amount.e8s()),
        fee: None,
        created_at_time: None,
        memo: Some(MemoIcrc(ByteBuf::from(block_index.to_be_bytes()))),
    };
    match icrc1_transfer(ogy_ledger_canister_id, &args).await {
        Ok(Ok(transfer_block_index)) => {
            mutate_state(|s| {
                s.data
                    .token_swap
                    .set_swap_block_index(block_index, transfer_block_index);
                s.data
                    .token_swap
                    .update_status(block_index, SwapStatus::Complete);
            });
            Ok(())
        }

        Ok(Err(msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::TransferFailed(
                        TransferFailReason::TransferError(msg.clone()),
                    )),
                )
            });
            Err(format!(
                "Final token transfer failed due to transfer error. Message: {msg}"
            ))
        }
        Err((_, msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::TransferFailed(TransferFailReason::CallError(
                        msg.clone(),
                    ))),
                )
            });
            Err(format!(
                "Final token transfer failed due to call error. Message: {msg}"
            ))
        }
    }
}
