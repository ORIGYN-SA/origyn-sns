use core::fmt;
use std::collections::VecDeque;
use candid::CandidType;
use serde::{ Serialize, Deserialize };
use super::account_tree::Overview;

#[derive(CandidType, Debug, Serialize, Default, Deserialize, Clone, PartialEq, Eq)]
pub enum IndexerType {
    #[default]
    DfinityIcp,
    DfinityIcrc2,
    DfinityIcrc3,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Default, Debug, PartialEq, Eq)]
pub struct ProcessedTX {
    pub block: u64,
    pub hash: String,
    pub tx_type: String,
    pub from_account: String,
    pub to_account: String,
    pub tx_value: u128,
    pub tx_fee: Option<u128>,
    pub spender: Option<String>,
    pub tx_time: u64,
}
impl fmt::Display for ProcessedTX {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Block: {}\nHash: {}\nType: {}\nFrom Account: {}\nTo Account: {}\nValue: {}\nTime: {}",
            self.block,
            self.hash,
            self.tx_type,
            self.from_account,
            self.to_account,
            self.tx_value,
            self.tx_time
        )
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub enum TransactionType {
    Transfer,
    Mint,
    Burn,
    Approve,
}
impl TransactionType {
    pub fn to_string(&self) -> String {
        match self {
            TransactionType::Transfer => "Transfer".to_string(),
            TransactionType::Mint => "Mint".to_string(),
            TransactionType::Burn => "Burn".to_string(),
            TransactionType::Approve => "Approve".to_string(),
        }
    }
}

#[derive(CandidType, Debug, Default, Serialize, Deserialize, Clone)]
pub struct SmallTX {
    pub block: u64,
    pub time: u64,
    pub from: Option<u64>,
    pub to: Option<u64>,
    pub tx_type: u8,
    pub value: u128,
    pub fee: Option<u128>,
}
impl fmt::Display for SmallTX {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Block: {}\nTime: {}\nFrom Account: {:?}\nTo Account: {:?}\nType: {}\nValue: {}\nFee: {:?}",
            self.block,
            self.time,
            self.from,
            self.to,
            self.tx_type,
            self.value,
            self.fee
        )
    }
}

#[derive(CandidType, Deserialize, Serialize, Default, Clone)]
pub struct BlockHolder {
    pub blocks: VecDeque<ProcessedTX>,
    pub tip: u64,
    pub hours_nano: u64,
    pub days_nano: u64,
}

#[derive(CandidType, Debug, Default, Serialize, Deserialize, Clone)]
pub struct TimeChunkStats {
    pub start_time: u64,
    pub end_time: u64,
    pub total_count: u64,
    pub mint_count: u64,
    pub transfer_count: u64,
    pub burn_count: u64,
    pub approve_count: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TimeStats {
    pub total_transaction_count: u128,
    pub total_transaction_value: u128,
    pub total_transaction_average: f64,
    pub total_unique_accounts: u64,
    pub total_unique_principals: u64,
    pub most_active_accounts: Vec<(String, u64)>,
    pub most_active_principals: Vec<(String, u64)>,
    pub burn_stats: TotCntAvg,
    pub mint_stats: TotCntAvg,
    pub transfer_stats: TotCntAvg,
    pub approve_stats: TotCntAvg,
    pub count_over_time: Vec<TimeChunkStats>,
    pub top_mints: Vec<ProcessedTX>,
    pub top_burns: Vec<ProcessedTX>,
    pub top_transfers: Vec<ProcessedTX>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TotCntAvg {
    pub total_value: u128,
    pub count: u128,
    pub average: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct HolderBalance {
    pub holder: u64,
    pub data: Overview,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct HolderBalanceResponse {
    pub holder: String,
    pub data: Overview,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TotalHolderResponse {
    pub total_accounts: u64,
    pub total_principals: u64,
}
