// This is an experimental feature to generate Rust binding from Candid.
// You may want to manually adjust some of the types.
#![allow(dead_code, unused_imports)]
use candid::{ self, CandidType, Decode, Deserialize, Encode, Nat, Principal };
use ic_cdk::api::call::CallResult as Result;
use ic_ledger_types::{ AccountIdentifier, BlockIndex, Subaccount, Tokens };

// #[derive(CandidType, Deserialize, PartialEq, Eq, Debug)]
// pub struct Tokens {
//     pub e8s: u64,
// }

#[derive(CandidType, Deserialize)]
pub struct Duration {
    pub secs: u64,
    pub nanos: u32,
}

#[derive(CandidType, Deserialize)]
pub struct Account {
    pub owner: Principal,
    pub subaccount: Option<Subaccount>,
}

#[derive(CandidType, Deserialize)]
pub struct ArchiveOptions {
    pub num_blocks_to_archive: u64,
    // pub max_transactions_per_response: Option<u64>,
    pub trigger_threshold: u64,
    pub max_message_size_bytes: Option<u64>,
    // pub cycles_for_archive_creation: Option<u64>,
    pub node_max_memory_size_bytes: Option<u64>,
    pub controller_id: Principal,
}

#[derive(CandidType, Deserialize)]
pub struct LedgerCanisterInitPayload {
    pub minting_account: String,
    pub initial_values: Vec<(String, Tokens)>,
    pub max_message_size_bytes: Option<u64>,
    pub transaction_window: Option<Duration>,
    pub archive_options: Option<ArchiveOptions>,
    pub standard_whitelist: Vec<Principal>,
    pub transfer_fee: Option<Tokens>,
    pub admin: Principal,
    pub send_whitelist: Vec<Principal>,
    pub token_symbol: Option<String>,
    pub token_name: Option<String>,
    // pub icrc1_minting_account: Option<Account>,
}

#[derive(CandidType, Deserialize)]
pub struct BinaryAccountBalanceArgs {
    pub account: serde_bytes::ByteBuf,
}

#[derive(CandidType, Deserialize)]
pub struct AccountBalanceArgs {
    pub account: String,
}

#[derive(CandidType, Deserialize)]
pub struct ArchiveInfo {
    pub canister_id: Principal,
}

#[derive(CandidType, Deserialize)]
pub struct Archives {
    pub archives: Vec<ArchiveInfo>,
}

#[derive(CandidType, Deserialize)]
pub struct Decimals {
    pub decimals: u32,
}

#[derive(CandidType, Deserialize)]
pub enum Value {
    Int(candid::Int),
    Nat(candid::Nat),
    Blob(serde_bytes::ByteBuf),
    Text(String),
}

#[derive(CandidType, Deserialize)]
pub struct StandardRecord {
    pub url: String,
    pub name: String,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArg {
    pub to: Account,
    pub fee: Option<candid::Nat>,
    pub memo: Option<serde_bytes::ByteBuf>,
    pub from_subaccount: Option<Subaccount>,
    pub created_at_time: Option<u64>,
    pub amount: candid::Nat,
}

#[derive(CandidType, Deserialize, Debug, PartialEq, Eq)]
pub enum TransferError {
    BadFee {
        expected_fee: Tokens,
    },
    InsufficientFunds {
        balance: Tokens,
    },
    TxTooOld {
        allowed_window_nanos: u64,
    },
    TxCreatedInFuture,
    TxDuplicate {
        duplicate_of: BlockIndex,
    },
}

#[derive(CandidType, Deserialize)]
pub enum Result_ {
    Ok(candid::Nat),
    Err(TransferError),
}

#[derive(CandidType, Deserialize)]
pub struct Name {
    pub name: String,
}

#[derive(CandidType, Deserialize)]
pub struct GetBlocksArgs {
    pub start: u64,
    pub length: u64,
}

#[derive(CandidType, Deserialize)]
pub struct TimeStamp {
    pub timestamp_nanos: u64,
}

#[derive(CandidType, Deserialize)]
pub enum CandidOperation {
    Approve {
        fee: Tokens,
        from: serde_bytes::ByteBuf,
        allowance_e8s: candid::Int,
        expires_at: Option<TimeStamp>,
        spender: serde_bytes::ByteBuf,
    },
    Burn {
        from: serde_bytes::ByteBuf,
        amount: Tokens,
    },
    Mint {
        to: serde_bytes::ByteBuf,
        amount: Tokens,
    },
    Transfer {
        to: serde_bytes::ByteBuf,
        fee: Tokens,
        from: serde_bytes::ByteBuf,
        amount: Tokens,
    },
    TransferFrom {
        to: serde_bytes::ByteBuf,
        fee: Tokens,
        from: serde_bytes::ByteBuf,
        amount: Tokens,
        spender: serde_bytes::ByteBuf,
    },
}

#[derive(CandidType, Deserialize)]
pub struct CandidTransaction {
    pub memo: u64,
    pub icrc1_memo: Option<serde_bytes::ByteBuf>,
    pub operation: CandidOperation,
    pub created_at_time: TimeStamp,
}

#[derive(CandidType, Deserialize)]
pub struct CandidBlock {
    pub transaction: CandidTransaction,
    pub timestamp: TimeStamp,
    pub parent_hash: Option<serde_bytes::ByteBuf>,
}

#[derive(CandidType, Deserialize)]
pub struct BlockRange {
    pub blocks: Vec<CandidBlock>,
}

#[derive(CandidType, Deserialize)]
pub enum GetBlocksError {
    BadFirstBlockIndex {
        requested_index: u64,
        first_valid_index: u64,
    },
    Other {
        error_message: String,
        error_code: u64,
    },
}

#[derive(CandidType, Deserialize)]
pub enum ArchivedBlocksRangeCallbackRet {
    Ok(BlockRange),
    Err(GetBlocksError),
}

candid::define_function!(pub ArchivedBlocksRangeCallback : (GetBlocksArgs) -> (
    ArchivedBlocksRangeCallbackRet,
  ) query);
#[derive(CandidType, Deserialize)]
pub struct ArchivedBlocksRange {
    pub callback: ArchivedBlocksRangeCallback,
    pub start: u64,
    pub length: u64,
}

#[derive(CandidType, Deserialize)]
pub struct QueryBlocksResponse {
    pub certificate: Option<serde_bytes::ByteBuf>,
    pub blocks: Vec<CandidBlock>,
    pub chain_length: u64,
    pub first_block_index: u64,
    pub archived_blocks: Vec<ArchivedBlocksRange>,
}

#[derive(CandidType, Deserialize)]
pub struct SendArgs {
    pub to: String,
    pub fee: Tokens,
    pub memo: u64,
    pub from_subaccount: Option<serde_bytes::ByteBuf>,
    pub created_at_time: Option<TimeStamp>,
    pub amount: Tokens,
}

#[derive(CandidType, Deserialize)]
pub struct Symbol {
    pub symbol: String,
}

#[derive(CandidType, Deserialize)]
pub struct TransferArgs {
    pub to: AccountIdentifier,
    pub fee: Tokens,
    pub memo: u64,
    pub from_subaccount: Option<Subaccount>,
    pub created_at_time: Option<TimeStamp>,
    pub amount: Tokens,
}

#[derive(CandidType, Deserialize)]
pub enum TransferError1 {
    TxTooOld {
        allowed_window_nanos: u64,
    },
    BadFee {
        expected_fee: Tokens,
    },
    TxDuplicate {
        duplicate_of: u64,
    },
    TxCreatedInFuture,
    InsufficientFunds {
        balance: Tokens,
    },
}

#[derive(CandidType, Deserialize)]
pub enum Result1 {
    Ok(u64),
    Err(TransferError1),
}

#[derive(CandidType, Deserialize)]
pub struct TransferFeeArg {}

#[derive(CandidType, Deserialize, Debug, PartialEq, Eq)]
pub struct TransferFee {
    pub transfer_fee: Tokens,
}

#[derive(CandidType, Deserialize)]
pub struct TransferStandardArgs {
    pub to: serde_bytes::ByteBuf,
    pub fee: Tokens,
    pub memo: u64,
    pub from_subaccount: Option<serde_bytes::ByteBuf>,
    pub from_principal: Principal,
    pub created_at_time: Option<TimeStamp>,
    pub amount: Tokens,
}

pub struct Service(pub Principal);
impl Service {
    pub async fn account_balance(&self, arg0: BinaryAccountBalanceArgs) -> Result<(Tokens,)> {
        ic_cdk::call(self.0, "account_balance", (arg0,)).await
    }
    pub async fn account_balance_dfx(&self, arg0: AccountBalanceArgs) -> Result<(Tokens,)> {
        ic_cdk::call(self.0, "account_balance_dfx", (arg0,)).await
    }
    pub async fn archives(&self) -> Result<(Archives,)> {
        ic_cdk::call(self.0, "archives", ()).await
    }
    pub async fn decimals(&self) -> Result<(Decimals,)> {
        ic_cdk::call(self.0, "decimals", ()).await
    }
    pub async fn icrc_1_balance_of(&self, arg0: Account) -> Result<(candid::Nat,)> {
        ic_cdk::call(self.0, "icrc1_balance_of", (arg0,)).await
    }
    pub async fn icrc_1_decimals(&self) -> Result<(u8,)> {
        ic_cdk::call(self.0, "icrc1_decimals", ()).await
    }
    pub async fn icrc_1_fee(&self) -> Result<(candid::Nat,)> {
        ic_cdk::call(self.0, "icrc1_fee", ()).await
    }
    pub async fn icrc_1_metadata(&self) -> Result<(Vec<(String, Value)>,)> {
        ic_cdk::call(self.0, "icrc1_metadata", ()).await
    }
    pub async fn icrc_1_minting_account(&self) -> Result<(Option<Account>,)> {
        ic_cdk::call(self.0, "icrc1_minting_account", ()).await
    }
    pub async fn icrc_1_name(&self) -> Result<(String,)> {
        ic_cdk::call(self.0, "icrc1_name", ()).await
    }
    pub async fn icrc_1_supported_standards(&self) -> Result<(Vec<StandardRecord>,)> {
        ic_cdk::call(self.0, "icrc1_supported_standards", ()).await
    }
    pub async fn icrc_1_symbol(&self) -> Result<(String,)> {
        ic_cdk::call(self.0, "icrc1_symbol", ()).await
    }
    pub async fn icrc_1_total_supply(&self) -> Result<(candid::Nat,)> {
        ic_cdk::call(self.0, "icrc1_total_supply", ()).await
    }
    pub async fn icrc_1_transfer(&self, arg0: TransferArg) -> Result<(Result_,)> {
        ic_cdk::call(self.0, "icrc1_transfer", (arg0,)).await
    }
    pub async fn name(&self) -> Result<(Name,)> {
        ic_cdk::call(self.0, "name", ()).await
    }
    pub async fn query_blocks(&self, arg0: GetBlocksArgs) -> Result<(QueryBlocksResponse,)> {
        ic_cdk::call(self.0, "query_blocks", (arg0,)).await
    }
    pub async fn send_dfx(&self, arg0: SendArgs) -> Result<(u64,)> {
        ic_cdk::call(self.0, "send_dfx", (arg0,)).await
    }
    pub async fn symbol(&self) -> Result<(Symbol,)> {
        ic_cdk::call(self.0, "symbol", ()).await
    }
    pub async fn transfer(&self, arg0: TransferArgs) -> Result<(Result1,)> {
        ic_cdk::call(self.0, "transfer", (arg0,)).await
    }
    pub async fn transfer_fee(&self, arg0: TransferFeeArg) -> Result<(TransferFee,)> {
        ic_cdk::call(self.0, "transfer_fee", (arg0,)).await
    }
    pub async fn transfer_standard_stdldg(&self, arg0: TransferStandardArgs) -> Result<(Result1,)> {
        ic_cdk::call(self.0, "transfer_standard_stdldg", (arg0,)).await
    }
}
