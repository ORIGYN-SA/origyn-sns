use std::collections::BTreeMap;

use candid::Principal;
use canister_time::now_millis;
use ic_ledger_types::{AccountIdentifier, BlockIndex, Tokens};
use icrc_ledger_types::icrc1::transfer::BlockIndex as BlockIndexIcrc;
use ledger_utils::principal_to_legacy_account_id;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct TokenSwap {
    swap: BTreeMap<BlockIndex, SwapInfo>,
}

impl TokenSwap {
    pub fn init_swap(
        &mut self,
        block_index: BlockIndex,
        principal: Principal,
    ) -> Result<Option<RecoverMode>, String> {
        match self.swap.get(&block_index) {
            Some(entry) => match &entry.status {
                SwapStatus::Complete => Err("Swap already completed.".to_string()),
                SwapStatus::Failed(fail_reason) => match fail_reason {
                    SwapError::BlockFailed(block_fail_reason) => {
                        match block_fail_reason {
                            BlockFailReason::NotFound => {
                                // If the block was not found previously, maybe somebody accidentally provided
                                // a block index that was higher than the latest one. To avoid blocking the proper
                                // execution of this block in the future, it will be recovered here.
                                self.swap.insert(block_index, SwapInfo::init(principal));
                                Ok(None)
                            }
                            BlockFailReason::QueryRequestFailed => {
                                // The previous attempt to request the info for this block failed on a higher level.
                                // Let's try again.
                                Ok(None)
                            }
                            BlockFailReason::ReceiverNotSwapCanister => {
                                // If this block is not sending tokens to the swap canister, it never will.
                                // So there is not reason to retry checking this block.
                                Err(format!("Block is not a valid swap block. The receiver of the token transfer is not the swap canister."))
                            }
                            BlockFailReason::SenderNotPrincipalDefaultSubaccount(account_id) => {
                                // Only if the new request is made with a different principal, there is a chance
                                // that the account_id is valid this time and we retry.
                                if *account_id != principal_to_legacy_account_id(principal, None) {
                                    self.swap.insert(block_index, SwapInfo::init(principal));
                                    Ok(None)
                                } else {
                                    Err("Account id in block is not the default subaccount of the requesting principal.".to_string())
                                }
                            }
                            BlockFailReason::InvalidOperation => {
                                // If this block doesn't contain a valid transfer operation, it never will.
                                // So there is no reason to retry checking this block.
                                Err(format!("Block is not a valid swap block. The operation is not a transfer operation."))
                            }
                            BlockFailReason::ZeroAmount => {
                                // If the token amount in the block is zero, there is no need for a swap.
                                // So there is no reason to retry checking this block.
                                Err("Amount of tokens in the block was zero. Skipping swap."
                                    .to_string())
                            }
                        }
                    }
                    SwapError::BurnFailed => Ok(Some(RecoverMode::RetryBurn)),
                    SwapError::TransferFailed => Ok(Some(RecoverMode::RetryTransfer)),
                },
                _ => Err("Swap already running.".to_string()),
            },
            None => {
                self.swap.insert(block_index, SwapInfo::init(principal));
                Ok(None)
            }
        }
    }

    pub fn update_status(&mut self, block_index: BlockIndex, status: SwapStatus) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => entry.status = status,
            None => (), // this is not possible because it was initialised before
        };
    }

    pub fn set_amount(&mut self, block_index: BlockIndex, amount: Tokens) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => entry.amount = amount,
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
            None => Err(format!("Entry not found for block index {block_index}.")), // this is not possible because it was initialised before
        }
    }
    pub fn set_burn_block_index(&mut self, block_index: BlockIndex, burn_block_index: BlockIndex) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => entry.burn_block_index = Some(burn_block_index),
            None => (), // this is not possible because it was initialised before
        }
    }
    pub fn set_swap_block_index(
        &mut self,
        block_index: BlockIndex,
        swap_block_index: BlockIndexIcrc,
    ) {
        match self.swap.get_mut(&block_index) {
            Some(entry) => entry.token_swap_block_index = Some(swap_block_index),
            None => (), // this is not possible because it was initialised before
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct SwapInfo {
    status: SwapStatus,
    amount: Tokens,
    principal: Principal,
    timestamp: u64,
    burn_block_index: Option<BlockIndex>,
    token_swap_block_index: Option<BlockIndexIcrc>,
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

#[derive(Serialize, Deserialize)]
pub enum SwapStatus {
    Init,
    BlockValid,
    BurnSuccess,
    Complete,
    Failed(SwapError),
}

#[derive(Serialize, Deserialize)]
pub enum SwapError {
    BlockFailed(BlockFailReason),
    BurnFailed,
    TransferFailed,
}

#[derive(Serialize, Deserialize)]
pub enum BlockFailReason {
    InvalidOperation,
    NotFound,
    QueryRequestFailed,
    ReceiverNotSwapCanister,
    SenderNotPrincipalDefaultSubaccount(AccountIdentifier),
    ZeroAmount,
}

pub enum RecoverMode {
    RetryBurn,
    // RetryQueryBlock,
    RetryTransfer,
}
