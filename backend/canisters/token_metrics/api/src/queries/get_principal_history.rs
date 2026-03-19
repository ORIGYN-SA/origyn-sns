use crate::types::ledger_indexer::{GetAccountHistoryArgs, HistoryData};

pub type Args = GetAccountHistoryArgs;
pub type Response = Vec<(u64, HistoryData)>;
