use crate::{
    consts::OGY_MIN_SWAP_AMOUNT,
    model::token_swap::{
        BlockFailReason,
        BurnFailReason,
        ImpossibleErrorReason,
        RecoverMode,
        SwapError,
        SwapStatus,
        TransferFailReason,
    },
    state::{ mutate_state, read_state },
};
use candid::{ CandidType, Nat, Principal };
use canister_tracing_macros::trace;
use ic_cdk::update;
use ic_ledger_types::{
    query_archived_blocks,
    query_blocks,
    transfer,
    ArchivedBlockRange,
    Block,
    BlockIndex,
    GetBlocksArgs,
    Memo,
    Operation,
    Subaccount,
    Tokens,
    TransferArgs,
};
use icrc_ledger_canister_c2c_client::icrc1_transfer;
use icrc_ledger_types::icrc1::{ account::Account, transfer::{ Memo as MemoIcrc, TransferArg } };
use ledger_utils::principal_to_legacy_account_id;
use serde::{ Deserialize, Serialize };
use serde_bytes::ByteBuf;
use utils::{ consts::E8S_FEE_OGY, env::Environment };

#[derive(CandidType, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum SwapTokensResponse {
    Success,
    InternalError(String),
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct SwapTokensRequest {
    pub block_index: BlockIndex,
    pub user: Option<Principal>,
}

#[update]
#[trace]
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
    principal: Principal
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

    match
        query_blocks(ogy_legacy_ledger_canister_id, GetBlocksArgs {
            start: block_index,
            length: 1,
        }).await
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
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound))
                    )
                });
                Err(format!("Block index {block_index} not found."))
            }
        }
        Err((_, err)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::QueryRequestFailed))
                )
            });
            Err(
                format!(
                    "Failed to request block info for block index {block_index}. Message: {err}"
                )
            )
        }
    }
}

pub fn verify_block_data(
    block: &Block,
    block_index: BlockIndex,
    principal: Principal
) -> Result<(), String> {
    // There is always exactly 1 transaction per block
    match block.transaction.operation {
        Some(Operation::Transfer { from, to, amount, fee: _ }) => {
            let expected_subaccount = Subaccount::from(principal);
            let expected_account_id = principal_to_legacy_account_id(
                read_state(|s| s.env.canister_id()),
                Some(expected_subaccount)
            );
            if to != expected_account_id {
                // The tokens have to have been sent to the swap canister with a subaccount that is equal to the
                // sending principal
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(
                            SwapError::BlockFailed(
                                BlockFailReason::ReceiverNotCorrectAccountId(expected_subaccount)
                            )
                        )
                    )
                });
                return Err(
                    format!(
                        "Receiving account for principal {principal} is not the correct account id. Expected {expected_account_id}, found {to}"
                    )
                );
            } else if from != principal_to_legacy_account_id(principal, None) {
                // The tokens have to have been sent from the default subaccount of the defined principal
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(
                            SwapError::BlockFailed(
                                BlockFailReason::SenderNotPrincipalDefaultSubaccount(from)
                            )
                        )
                    )
                });
                return Err(
                    format!("Sending account is not default subaccount of principal {principal}.")
                );
            } else if amount < OGY_MIN_SWAP_AMOUNT - Tokens::from_e8s(E8S_FEE_OGY) {
                // The amount has to be greated than the minimum amount to conduct a swap.
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::AmountTooSmall))
                    )
                });
                return Err(
                    format!(
                        "Number of tokens in block is too small. Needs to be at least {}, found: {}.",
                        OGY_MIN_SWAP_AMOUNT,
                        amount + Tokens::from_e8s(E8S_FEE_OGY)
                    )
                );
            } else {
                // This is the happy path if the conditions above are fulfilled
                mutate_state(|s| {
                    s.data.token_swap.set_amount(block_index, amount);
                    s.data.token_swap.update_status(block_index, SwapStatus::BlockValid);
                });
            }
            Ok(())
        }
        _ =>
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::InvalidOperation))
                );
                Err(format!("Operation in block is not a valid transfer."))
            }),
    }
}

async fn process_archive_block(
    archive_block_range: &ArchivedBlockRange,
    block_index: BlockIndex,
    principal: Principal
) -> Result<(), String> {
    match
        query_archived_blocks(&archive_block_range.callback, GetBlocksArgs {
            start: archive_block_range.start,
            length: archive_block_range.length,
        }).await
    {
        Ok(Ok(block_range)) => {
            if block_range.blocks.len() > 0 {
                verify_block_data(&block_range.blocks[0], block_index, principal)
            } else {
                mutate_state(|s| {
                    s.data.token_swap.update_status(
                        block_index,
                        SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound))
                    );
                });
                Err(format!("Block {block_index} not found in archive canister."))
            }
        }
        _ => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(SwapError::BlockFailed(BlockFailReason::NotFound))
                );
            });
            Err(format!("Block {block_index} not found in archive canister."))
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
                SwapStatus::Failed(
                    SwapError::UnexpectedError(ImpossibleErrorReason::PrincipalNotFound)
                )
            );
        });
        return Err(
            format!("Principal not found in internal token_swap list for block {block_index}.")
        );
    }
    if amount < OGY_MIN_SWAP_AMOUNT - Tokens::from_e8s(E8S_FEE_OGY) {
        // This was already checked above when the block was analysed but checking again to be sure.
        return Err(
            format!(
                "At least {} OGY need to be swapped. Found: {}.",
                OGY_MIN_SWAP_AMOUNT,
                amount + Tokens::from_e8s(E8S_FEE_OGY)
            )
        );
    }
    let args = TransferArgs {
        memo: Memo(block_index),
        to: ogy_legacy_minting_account,
        amount,
        fee: Tokens::from_e8s(0), // fees for burning are 0
        from_subaccount: Some(Subaccount::from(principal)),
        created_at_time: None,
    };
    match transfer(ogy_legacy_ledger_canister_id, args).await {
        Ok(Ok(burn_block_index)) => {
            mutate_state(|s| {
                s.data.token_swap.set_burn_block_index(block_index, burn_block_index);
                s.data.token_swap.update_status(block_index, SwapStatus::BurnSuccess);
            });
            Ok(())
        }
        Ok(Err(msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(
                        SwapError::BurnFailed(BurnFailReason::TransferError(msg.clone()))
                    )
                )
            });
            Err(format!("Token burn failed due to transfer error. Message: {msg}"))
        }
        Err((_, msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(
                        SwapError::BurnFailed(BurnFailReason::CallError(msg.clone()))
                    )
                )
            });
            Err(format!("Token burn failed due to call error. Message: {msg}"))
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

    // ORIGYN will cover the swapping fees so the user ends up with exactly 1:1 tokens after the swap
    let amount_to_swap = amount + Tokens::from_e8s(E8S_FEE_OGY);

    if amount_to_swap < OGY_MIN_SWAP_AMOUNT {
        // This was already checked above when the block was analysed but checking again to be sure.
        return Err(
            format!(
                "At least {OGY_MIN_SWAP_AMOUNT} OGY need to be swapped. Found: {amount_to_swap}."
            )
        );
    }
    let args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: principal,
            subaccount: None,
        },
        amount: Nat::from(amount_to_swap.e8s()),
        fee: None,
        created_at_time: None,
        memo: Some(MemoIcrc(ByteBuf::from(block_index.to_be_bytes()))),
    };
    match icrc1_transfer(ogy_ledger_canister_id, &args).await {
        Ok(Ok(transfer_block_index)) => {
            mutate_state(|s| {
                s.data.token_swap.set_swap_block_index(block_index, transfer_block_index);
                s.data.token_swap.update_status(block_index, SwapStatus::Complete);
            });
            Ok(())
        }

        Ok(Err(msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(
                        SwapError::TransferFailed(TransferFailReason::TransferError(msg.clone()))
                    )
                )
            });
            Err(format!("Final token transfer failed due to transfer error. Message: {msg}"))
        }
        Err((_, msg)) => {
            mutate_state(|s| {
                s.data.token_swap.update_status(
                    block_index,
                    SwapStatus::Failed(
                        SwapError::TransferFailed(TransferFailReason::CallError(msg.clone()))
                    )
                )
            });
            Err(format!("Final token transfer failed due to call error. Message: {msg}"))
        }
    }
}

#[cfg(test)]
mod tests {
    use candid::Principal;
    use ic_ledger_types::{
        AccountIdentifier,
        Block,
        BlockIndex,
        Memo,
        Operation,
        Subaccount,
        Timestamp,
        Tokens,
        Transaction,
        DEFAULT_SUBACCOUNT,
    };
    use ledger_utils::principal_to_legacy_account_id;
    use utils::{ consts::{ E8S_FEE_OGY, E8S_PER_OGY }, env::CanisterEnv };

    use crate::state::{ init_state, mutate_state, Data, RuntimeState };

    use super::verify_block_data;

    const OGY_SWAP_CANISTER_ID: Principal = Principal::anonymous(); // on non-wasm architecture, id() of canister is not available
    const DUMMY_USER: &str = "465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae";

    #[test]
    fn test_verify_block_valid() {
        init_canister_state();

        let block_index = 1000;
        let principal = Principal::from_text(DUMMY_USER).unwrap();
        init_swap(block_index, principal);

        let block = dummy_block();

        let result = verify_block_data(&block, block_index, principal);
        let expected_result = Ok(());

        assert_eq!(expected_result, result)
    }
    #[test]
    fn test_verify_block_wrong_recipient() {
        init_canister_state();

        let block_index = 1000;
        let principal = Principal::anonymous();
        init_swap(block_index, principal);

        let block = dummy_block();

        let result = verify_block_data(&block, block_index, principal);
        let expected_account_id = principal_to_legacy_account_id(
            OGY_SWAP_CANISTER_ID,
            Some(Subaccount::from(principal))
        );
        let to = principal_to_legacy_account_id(
            OGY_SWAP_CANISTER_ID,
            Some(Subaccount::from(Principal::from_text(DUMMY_USER).unwrap()))
        );
        let expected_result = Err(
            format!(
                "Receiving account for principal {principal} is not the correct account id. Expected {expected_account_id}, found {to}"
            )
        );

        assert_eq!(expected_result, result)
    }
    #[test]
    fn test_verify_block_wrong_sender() {
        init_canister_state();

        let block_index = 1000;
        let principal = Principal::from_text(DUMMY_USER).unwrap();
        init_swap(block_index, principal);

        let mut block = dummy_block();
        if let Some(Operation::Transfer { ref mut from, .. }) = block.transaction.operation {
            *from = principal_to_legacy_account_id(principal, Some(Subaccount([1; 32])));
        }

        let result = verify_block_data(&block, block_index, principal);

        let expected_result = Err(
            format!("Sending account is not default subaccount of principal {principal}.")
        );

        assert_eq!(expected_result, result)
    }
    #[test]
    fn test_verify_block_amount_too_small() {
        init_canister_state();

        let block_index = 1000;
        let principal = Principal::from_text(DUMMY_USER).unwrap();
        init_swap(block_index, principal);

        let mut block = dummy_block();
        if let Some(Operation::Transfer { ref mut amount, .. }) = block.transaction.operation {
            *amount = Tokens::from_e8s(90_000_000u64);
        }

        let result = verify_block_data(&block, block_index, principal);

        let expected_result = Err(
            format!(
                "Number of tokens in block is too small. Needs to be at least 1.00000000, found: 0.90000000."
            )
        );

        assert_eq!(expected_result, result)
    }
    #[test]
    fn test_verify_block_invalid_operation() {
        init_canister_state();

        let block_index = 1000;
        let principal = Principal::from_text(DUMMY_USER).unwrap();
        init_swap(block_index, principal);

        let mut block = dummy_block();
        block.transaction.operation = Some(Operation::Mint {
            to: dummy_account(),
            amount: Tokens::from_e8s(100_000_000),
        });

        let result = verify_block_data(&block, block_index, principal);

        let expected_result = Err(format!("Operation in block is not a valid transfer."));

        assert_eq!(expected_result, result)
    }

    fn dummy_block() -> Block {
        let user: Principal = Principal::from_text(DUMMY_USER).unwrap();
        let from = AccountIdentifier::new(&user, &DEFAULT_SUBACCOUNT);
        let to = AccountIdentifier::new(&OGY_SWAP_CANISTER_ID, &Subaccount::from(user));
        let amount = Tokens::from_e8s(1 * E8S_PER_OGY);
        Block {
            transaction: Transaction {
                memo: Memo(0u64),
                operation: Some(Operation::Transfer {
                    from,
                    to,
                    amount,
                    fee: Tokens::from_e8s(E8S_FEE_OGY),
                }),
                created_at_time: Timestamp { timestamp_nanos: 0 },
                icrc1_memo: None,
            },
            timestamp: Timestamp {
                timestamp_nanos: 1_711_037_458_268_430_767,
            },
            parent_hash: None,
        }
    }

    fn dummy_account() -> AccountIdentifier {
        AccountIdentifier::new(&Principal::from_text(DUMMY_USER).unwrap(), &DEFAULT_SUBACCOUNT)
    }

    fn init_canister_state() {
        let ogy_legacy_ledger_canister_id = Principal::from_text(
            "jwcfb-hyaaa-aaaaj-aac4q-cai"
        ).unwrap();
        let ogy_new_ledger_canister_id = Principal::from_text(
            "tr3th-kiaaa-aaaaq-aab6q-cai"
        ).unwrap();
        let ogy_legacy_minting_account_principal = Principal::from_text(
            "aomfs-vaaaa-aaaaj-aadoa-cai"
        ).unwrap();

        let env = CanisterEnv::new(false);
        let data = Data::new(
            ogy_new_ledger_canister_id,
            ogy_legacy_ledger_canister_id,
            ogy_legacy_minting_account_principal
        );

        let runtime_state = RuntimeState::new(env, data);

        init_state(runtime_state);
    }

    fn init_swap(block_index: BlockIndex, principal: Principal) {
        let _ = mutate_state(|s| s.data.token_swap.init_swap(block_index, principal));
    }
}
