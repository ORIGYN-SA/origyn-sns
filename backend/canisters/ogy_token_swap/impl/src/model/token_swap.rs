use std::collections::BTreeMap;

use candid::{ CandidType, Principal };
use canister_time::now_millis;
use ic_ledger_types::{ AccountIdentifier, BlockIndex, Subaccount, Tokens, TransferError };
use icrc_ledger_types::icrc1::transfer::{
    BlockIndex as BlockIndexIcrc,
    TransferError as TransferErrorIcrc,
};
use ledger_utils::principal_to_legacy_account_id;
use serde::{ Deserialize, Serialize };

#[derive(Serialize, Deserialize, Default)]
pub struct TokenSwap {
    swap: BTreeMap<BlockIndex, SwapInfo>,
}

impl TokenSwap {
    pub fn init_swap(
        &mut self,
        block_index: BlockIndex,
        principal: Principal
    ) -> Result<Option<RecoverMode>, String> {
        match self.swap.get(&block_index) {
            Some(entry) =>
                match &entry.status {
                    SwapStatus::Complete => Err("Swap already completed.".to_string()),
                    SwapStatus::Failed(fail_reason) =>
                        match fail_reason {
                            SwapError::BlockFailed(block_fail_reason) => {
                                match block_fail_reason {
                                    BlockFailReason::NotFound => {
                                        // If the block was not found previously, maybe somebody accidentally provided
                                        // a block index that was higher than the latest one. To avoid blocking the proper
                                        // execution of this block in the future, it will be recovered here.
                                        self.swap.insert(block_index, SwapInfo::init(principal));
                                        Ok(Some(RecoverMode::RetryBlockValidation))
                                    }
                                    BlockFailReason::QueryRequestFailed => {
                                        // The previous attempt to request the info for this block failed on a higher level.
                                        // Let's try again.
                                        Ok(Some(RecoverMode::RetryBlockValidation))
                                    }
                                    BlockFailReason::ReceiverNotCorrectAccountId(subaccount) => {
                                        // If the account id was wrong in the previous block that was checked, it could be
                                        // that the wrong principal was provided as a subaccount.
                                        // Check if new subaccount (principal) was provided and retry block validation if yes.
                                        // Otherwise skip.
                                        if *subaccount != Subaccount::from(principal) {
                                            self.swap.insert(
                                                block_index,
                                                SwapInfo::init(principal)
                                            );
                                            Ok(Some(RecoverMode::RetryBlockValidation))
                                        } else {
                                            Err(
                                                format!(
                                                    "Block is not a valid swap block and no new principal was provided. Not attempting a retry. Principal {principal}"
                                                )
                                            )
                                        }
                                    }
                                    BlockFailReason::SenderNotPrincipalDefaultSubaccount(
                                        account_id,
                                    ) => {
                                        // Only if the new request is made with a different principal, there is a chance
                                        // that the account_id is valid this time and we retry.
                                        if
                                            *account_id !=
                                            principal_to_legacy_account_id(principal, None)
                                        {
                                            self.swap.insert(
                                                block_index,
                                                SwapInfo::init(principal)
                                            );
                                            Ok(Some(RecoverMode::RetryBlockValidation))
                                        } else {
                                            Err(
                                                "Account id in block is not the default subaccount of the requesting principal.".to_string()
                                            )
                                        }
                                    }
                                    BlockFailReason::InvalidOperation => {
                                        // If this block doesn't contain a valid transfer operation, it never will.
                                        // So there is no reason to retry checking this block.
                                        Err(
                                            format!(
                                                "Block is not a valid swap block. The operation is not a transfer operation."
                                            )
                                        )
                                    }
                                    BlockFailReason::AmountTooSmall => {
                                        // If the token amount in the block is was too small, there is no need for a swap.
                                        // So there is no reason to retry checking this block.
                                        Err(
                                            "Amount of tokens in the block was too small. Skipping swap.".to_string()
                                        )
                                    }
                                }
                            }
                            SwapError::BurnFailed(_) => Ok(Some(RecoverMode::RetryBurn)),
                            SwapError::TransferFailed(_) => Ok(Some(RecoverMode::RetryTransfer)),
                            SwapError::UnexpectedError(reason) =>
                                Err(
                                    format!(
                                        "Previous execution ended with an unexpected error. Blocking any further execution as this indicates corrupted data. Reason: {reason:?}"
                                    )
                                ),
                        }
                    _ => Err("Swap already running.".to_string()),
                }
            None => {
                self.swap.insert(block_index, SwapInfo::init(principal));
                Ok(None)
            }
        }
    }

    pub fn get_swap_info(&self, block_index: BlockIndex) -> Option<&SwapInfo> {
        self.swap.get(&block_index)
    }

    pub fn update_status(&mut self, block_index: BlockIndex, status: SwapStatus) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => {
                entry.status = status;
            }
            None => (), // this is not possible because it was initialised before
        };
    }

    pub fn set_amount(&mut self, block_index: BlockIndex, amount: Tokens) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => {
                entry.amount = amount;
            }
            None => (), // this is not possible because it was initialised before
        }
    }
    pub fn get_amount(&self, block_index: BlockIndex) -> Tokens {
        match self.swap.get(&block_index) {
            Some(swap_info) => swap_info.amount.clone(),
            None => Tokens::from_e8s(0), // this is not possible because it was initialised before
        }
    }
    pub fn get_principal(&self, block_index: BlockIndex) -> Result<Principal, String> {
        match self.swap.get(&block_index) {
            Some(swap_info) => Ok(swap_info.principal.clone()),
            None => Err(format!("No principal entry not found for block index {block_index}.")), // this is not possible because it was initialised before but validating here in any case
        }
    }
    pub fn set_burn_block_index(&mut self, block_index: BlockIndex, burn_block_index: BlockIndex) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => {
                entry.burn_block_index = Some(burn_block_index);
            }
            None => (), // this is not possible because it was initialised before
        }
    }
    pub fn set_swap_block_index(
        &mut self,
        block_index: BlockIndex,
        swap_block_index: BlockIndexIcrc
    ) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => {
                entry.token_swap_block_index = Some(swap_block_index);
            }
            None => (), // this is not possible because it was initialised before
        }
    }
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub struct SwapInfo {
    pub status: SwapStatus,
    pub amount: Tokens,
    pub principal: Principal,
    pub timestamp: u64,
    pub burn_block_index: Option<BlockIndex>,
    pub token_swap_block_index: Option<BlockIndexIcrc>,
}

impl SwapInfo {
    pub fn init(principal: Principal) -> Self {
        Self {
            status: SwapStatus::Init,
            principal,
            amount: Tokens::from_e8s(0),
            timestamp: now_millis(),
            burn_block_index: None,
            token_swap_block_index: None,
        }
    }
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub enum SwapStatus {
    Init,
    BlockValid,
    BurnSuccess,
    Complete,
    Failed(SwapError),
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub enum SwapError {
    BlockFailed(BlockFailReason),
    BurnFailed(BurnFailReason),
    TransferFailed(TransferFailReason),
    UnexpectedError(ImpossibleErrorReason),
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub enum BlockFailReason {
    InvalidOperation,
    NotFound,
    QueryRequestFailed,
    ReceiverNotCorrectAccountId(Subaccount),
    SenderNotPrincipalDefaultSubaccount(AccountIdentifier),
    AmountTooSmall,
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub enum BurnFailReason {
    TransferError(TransferError),
    CallError(String),
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub enum TransferFailReason {
    TransferError(TransferErrorIcrc),
    CallError(String),
}

#[derive(Serialize, Deserialize, Debug, CandidType, Clone, PartialEq, Eq)]
pub enum ImpossibleErrorReason {
    PrincipalNotFound,
    AmountNotFound,
}

pub enum RecoverMode {
    RetryBurn,
    RetryBlockValidation,
    RetryTransfer,
}
