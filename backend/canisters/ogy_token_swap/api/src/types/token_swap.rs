use std::borrow::Cow;

use candid::{ CandidType, Decode, Encode, Nat, Principal };
use canister_time::{ timestamp_millis, SECOND_IN_MS };
use ic_stable_structures::{ storable::Bound, Storable };
use serde::{ Deserialize, Serialize };
use types::{ Milliseconds, TimestampNanos };
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{
        Memo as MemoIcrc,
        TransferError as TransferErrorIcrc,
        BlockIndex as BlockIndexIcrc,
    },
};
use ic_ledger_types::{
    AccountIdentifier,
    Memo,
    Subaccount,
    Timestamp,
    Tokens,
    TransferError,
    BlockIndex,
};

const MAX_SWAP_INFO_BYTES_SIZE: u32 = 1000;
const MINIMUM_TIMEOUT_IN_SECONDS: u64 = 30;
const MINIMUM_TIMEOUT_IN_MS: Milliseconds = MINIMUM_TIMEOUT_IN_SECONDS * SECOND_IN_MS;

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub struct SwapInfo {
    pub status: SwapStatus,
    pub amount: u64,
    pub principal: Principal,
    pub first_request: u64,
    pub last_request: u64,
    pub burn_block_index: Option<BlockIndex>,
    pub token_swap_block_index: Option<BlockIndexIcrc>,
    pub archiving_failed: bool,
}

impl Storable for SwapInfo {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }
    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_SWAP_INFO_BYTES_SIZE,
        is_fixed_size: false,
    };
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
            archiving_failed: false,
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
    TokenBalanceAndSwapRequestDontMatch,
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
