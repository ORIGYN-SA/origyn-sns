use core::fmt;
use std::collections::VecDeque;
use candid::{CandidType, Nat};
use num_bigint::BigUint;
use serde::{Serialize, Deserialize};
use super::{constants::MAX_BLOCKS_RETAINED, account_tree::{Overview, LinkData}};

 #[derive(CandidType, Debug, Serialize, Default, Deserialize, Clone, PartialEq, Eq)]
pub enum IndexerType{
    #[default]
    DfinityIcp,
    DfinityIcrc2,
    MemeIcrc
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
    Approve
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
    pub fee: Option<u128>
}


#[derive(CandidType, Deserialize, Serialize, Default, Clone)]
pub struct BlockHolder {
    pub blocks: VecDeque<ProcessedTX>,
    pub tip: u64,
}
impl BlockHolder {
    pub const MAX_SIZE: usize = MAX_BLOCKS_RETAINED;

    pub fn init(&mut self){
            self.blocks = VecDeque::with_capacity(Self::MAX_SIZE);
            self.tip = 0_u64;
    }

    pub fn push_tx(&mut self, tx: ProcessedTX) {
        if self.blocks.len() ==  Self::MAX_SIZE {
            self.blocks.pop_back();
        }
        self.tip = tx.block.clone();
        self.blocks.push_front(tx);
    }

    pub fn get_txs(&self, number_txs: usize) -> Vec<ProcessedTX> {
        let n = if number_txs > Self::MAX_SIZE { Self::MAX_SIZE } else { number_txs };
        let vec: Vec<ProcessedTX> = self.blocks.iter().take(n).cloned().collect();
        return vec
    }
}

// used for sending blocks to store canister
#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct SendTxToStoreArgs(pub Vec<SmallTX>);

// used for getting tx from tx store
#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct GetTxFromStoreArgs(pub u64);

// used for getting mutiple tx from tx store
#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct GetMultipleTxFromStoreArgs(pub Vec<u64>);

// used for getting mutiple tx from tx store BY TIME
#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct GetMultipleTxFromStoreTimeArgs {
    pub blocks: Vec<u64>, 
    pub start: u64, 
    pub end: u64, 
    pub max_return: u64
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TimeSearchArgs {
    pub id: String,
    pub start: u64, 
    pub end: u64, 
}

#[derive(CandidType, Deserialize, Serialize, Clone, Default, Debug, PartialEq, Eq)]
pub struct LinkDataResponse {
   pub linked_from: u64,
   pub linked_id: String,
   pub number_txs: u32,
   pub gross: u128,
   pub net: i128
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FullDataResponseRaw {
   pub account_ref: u64,
   pub overview: Overview,
   pub links: Vec<LinkData>, 
   pub blocks: Vec<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FullDataResponse {
   pub account_ref: String,
   pub overview: Overview,
   pub links: Vec<LinkDataResponse>, 
   pub blocks: Vec<ProcessedTX>,
}
