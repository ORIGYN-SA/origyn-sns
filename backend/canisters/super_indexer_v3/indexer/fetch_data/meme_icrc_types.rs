use candid::{CandidType, Nat, Principal};
use serde::Deserialize;

pub const DEFAULT_SUBACCOUNT: [u8; 32] = [0; 32];

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct GetTransactionsRequest1 {
  pub start: Nat,
  pub length: Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct GetTransactionsResponse {
  pub first_index: Nat,
  pub log_length: Nat,
  pub transactions: Vec<Transaction>,
  pub archived_transactions: Vec<ArchivedTransaction>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransactionRange { pub transactions: Vec<Transaction> }

candid::define_function!(pub QueryArchiveFn : (GetTransactionsRequest1) -> (
  TransactionRange,
) query);

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ArchivedTransaction {
  pub callback: QueryArchiveFn,
  pub start: Nat,
  pub length: candid::Nat,
}
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Transaction {
  pub burn: Option<Burn>,
  pub kind: String,
  pub mint: Option<Mint1>,
  pub timestamp: u64,
  pub index: Nat,
  pub transfer: Option<Transfer>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Burn {
  pub from: Account,
  pub memo: Option<serde_bytes::ByteBuf>,
  pub created_at_time: Option<u64>,
  pub amount: Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Mint1 {
  pub to: Account,
  pub memo: Option<serde_bytes::ByteBuf>,
  pub created_at_time: Option<u64>,
  pub amount: Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Transfer {
  pub to: Account,
  pub fee: Option<Nat>,
  pub from: Account,
  pub memo: Option<serde_bytes::ByteBuf>,
  pub created_at_time: Option<u64>,
  pub amount: Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Account { pub owner: Principal, pub subaccount: Option<serde_bytes::ByteBuf> }
