use candid::{CandidType, Deserialize};
use ic_stable_memory::derive::{StableType, AsFixedSizeBytes};

#[derive(CandidType, Deserialize, Clone, Default, Debug)]
pub struct GetMultipleTxFromStoreTimeArgs {
    pub blocks: Vec<u64>, 
    pub start: u64, 
    pub end: u64, 
    pub max_return: u64
}

#[derive(CandidType, StableType, AsFixedSizeBytes, Debug, Deserialize, Default, Clone, Copy)]
pub struct SmallTX {
    pub block: u64, 
    pub time: u64, 
    pub from: Option<u64>, 
    pub to: Option<u64>,
    pub tx_type: u8, 
    pub value: u128, 
    pub fee: Option<u128> 
}

// used for canister logging.
#[derive(CandidType, Debug, Default, Clone)]
pub struct LogEntry {
    pub timestamp: String,
    pub text: String,
}
