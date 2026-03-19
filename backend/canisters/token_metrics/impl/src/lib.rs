use ic_cdk::export_candid;

mod guards;
mod jobs;
pub mod ledger_indexer;
mod lifecycle;
mod memory;
mod migrations;
pub mod model;
pub mod queries;
pub mod state;
pub mod utils;

use lifecycle::*;
use queries::*;

// Types needed by export_candid!() for ledger indexer endpoints
use token_metrics_api::types::ledger_indexer::{
    ActivitySnapshot, GetAccountHistoryArgs, GetAccountHoldersArgs, GetPrincipalHoldersArgs,
    HistoryData, HolderBalanceResponse, InitLedgerArgs, Overview, TimeStats, TotalHolderResponse,
    WorkingStats,
};

export_candid!();
