use std::collections::BTreeMap;

use candid::{ CandidType, Nat, Principal };
use canister_time::{ timestamp_millis, SECOND_IN_MS };
use ic_ledger_types::{
    AccountIdentifier,
    BlockIndex,
    Memo,
    Subaccount,
    Timestamp,
    Tokens,
    TransferError,
};
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{
        BlockIndex as BlockIndexIcrc,
        Memo as MemoIcrc,
        TransferError as TransferErrorIcrc,
    },
};
use ledger_utils::principal_to_legacy_account_id;
use serde::{ Deserialize, Serialize };
use types::{ Milliseconds, TimestampNanos };

use crate::updates::recover_stuck_transfer::Response as RecoverStuckTransferResponse;

const MINIMUM_TIMEOUT_IN_SECONDS: u64 = 30;
const MINIMUM_TIMEOUT_IN_MS: Milliseconds = MINIMUM_TIMEOUT_IN_SECONDS * SECOND_IN_MS;

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
            Some(entry) => {
                // only allow requests per block_index within a certain interval to avoid spamming attempts
                entry.check_timeout()?;
                // if all good continue with the check
                match &entry.status {
                    SwapStatus::Complete(block_index) =>
                        Err(format!("Swap already completed on block {block_index}.")),
                    SwapStatus::Failed(fail_reason) =>
                        match fail_reason {
                            SwapError::BlockFailed(block_fail_reason) => {
                                match block_fail_reason {
                                    BlockFailReason::NotFound => {
                                        // If the block was not found previously, maybe somebody accidentally provided
                                        // a block index that was higher than the latest one. To avoid blocking the proper
                                        // execution of this block in the future, it will be recovered here.
                                        self.swap.insert(block_index, SwapInfo::new(principal));
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
                                            self.swap.insert(block_index, SwapInfo::new(principal));
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
                                            self.swap.insert(block_index, SwapInfo::new(principal));
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
                                            "Block is not a valid swap block. The operation is not a transfer operation.".to_string()
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
                    | SwapStatus::Init
                    | SwapStatus::BlockRequest(_)
                    | SwapStatus::BlockValid
                    | SwapStatus::BurnRequest(_)
                    | SwapStatus::BurnSuccess
                    | SwapStatus::TransferRequest(_) => Err("Swap already running.".to_string()),
                }
            }
            None => {
                self.swap.insert(block_index, SwapInfo::new(principal));
                Ok(None)
            }
        }
    }

    pub fn recover_stuck_transfer(
        &mut self,
        block_index: BlockIndex
    ) -> Result<(), RecoverStuckTransferResponse> {
        match self.swap.get_mut(&block_index) {
            Some(entry) =>
                match entry.status.clone() {
                    // If the swap status is in state TransferRequest, reset state to before transfer request and an attempt to recover can be made
                    SwapStatus::TransferRequest(_) => {
                        entry.status = SwapStatus::BurnSuccess;
                        Ok(())
                    }
                    // In all other cases, there is no legitimate reason to retry to recover
                    val => Err(RecoverStuckTransferResponse::SwapIsNotStuckInTransfer(val.clone())),
                }
            // If not entry is found for this block_index, it's not a valid request
            None => Err(RecoverStuckTransferResponse::NoSwapRequestFound),
        }
    }

    pub fn check_timeout(&mut self, block_index: BlockIndex) -> Result<(), String> {
        match self.swap.get_mut(&block_index) {
            Some(entry) => entry.check_timeout(),
            None => Err(format!("No entry found for block index {}", block_index)),
        }
    }

    pub fn update_last_request_time(&mut self, block_index: BlockIndex) -> Result<u64, String> {
        match self.swap.get_mut(&block_index) {
            Some(entry) => {
                let now = timestamp_millis();
                entry.last_request = now;
                Ok(now)
            }
            None => Err(format!("No entry found for block index {}", block_index)),
        }
    }

    pub fn get_swap_info(&self, block_index: BlockIndex) -> Option<&SwapInfo> {
        self.swap.get(&block_index)
    }

    pub fn update_status(&mut self, block_index: BlockIndex, status: SwapStatus) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.status = status;
        }; // other case is not possible because it was initialised before
    }

    pub fn set_amount(&mut self, block_index: BlockIndex, amount: u64) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.amount = amount;
        } // other case is not possible because it was initialised before
    }
    pub fn get_amount(&self, block_index: BlockIndex) -> u64 {
        match self.swap.get(&block_index) {
            Some(swap_info) => swap_info.amount,
            None => 0, // this is not possible because it was initialised before
        }
    }
    pub fn get_principal(&self, block_index: BlockIndex) -> Result<Principal, String> {
        match self.swap.get(&block_index) {
            Some(swap_info) => Ok(swap_info.principal),
            None => Err(format!("No principal entry not found for block index {block_index}.")), // this is not possible because it was initialised before but validating here in any case
        }
    }
    pub fn set_burn_block_index(&mut self, block_index: BlockIndex, burn_block_index: BlockIndex) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.burn_block_index = Some(burn_block_index);
        } // other case is not possible because it was initialised before
    }
    pub fn set_swap_block_index(
        &mut self,
        block_index: BlockIndex,
        swap_block_index: BlockIndexIcrc
    ) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.token_swap_block_index = Some(swap_block_index);
        } // other case is not possible because it was initialised before
    }
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub struct SwapInfo {
    pub status: SwapStatus,
    pub amount: u64,
    pub principal: Principal,
    pub first_request: u64,
    pub last_request: u64,
    pub burn_block_index: Option<BlockIndex>,
    pub token_swap_block_index: Option<BlockIndexIcrc>,
}

impl SwapInfo {
    pub fn new(principal: Principal) -> Self {
        Self {
            status: SwapStatus::Init,
            principal,
            amount: 0,
            first_request: timestamp_millis(),
            last_request: timestamp_millis(),
            burn_block_index: None,
            token_swap_block_index: None,
        }
    }

    pub fn check_timeout(&self) -> Result<(), String> {
        if timestamp_millis() - self.last_request > MINIMUM_TIMEOUT_IN_MS {
            Ok(())
        } else {
            Err(
                format!(
                    "Timeout not yet reached. Wait at least {MINIMUM_TIMEOUT_IN_SECONDS} seconds between requests."
                )
            )
        }
    }
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub enum SwapStatus {
    Init,
    BlockRequest(BlockIndex),
    BlockValid,
    BurnRequest(BurnRequestArgs),
    BurnSuccess,
    TransferRequest(TransferRequestArgs),
    Complete(BlockIndexIcrc),
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
    NoTokensToBurn,
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

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub struct BurnRequestArgs {
    pub created_at_time: Option<Timestamp>,
    pub from_subaccount: Option<Subaccount>,
    pub amount: Tokens,
    pub memo: Memo,
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub struct TransferRequestArgs {
    pub created_at_time: Option<TimestampNanos>,
    pub to: Account,
    pub amount: Nat,
    pub memo: Option<MemoIcrc>,
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum RecoverBurnMode {
    RetryBurn,
    BurnBlockProvided(BlockIndex),
}

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum RecoverTransferMode {
    RetryTransfer,
    TransferBlockProvided(BlockIndexIcrc),
}
