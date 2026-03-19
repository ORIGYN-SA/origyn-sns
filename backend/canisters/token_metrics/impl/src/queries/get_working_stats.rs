use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::WorkingStats;
use crate::ledger_indexer::state::with_overviews;
use crate::state::read_state;

#[query]
fn get_working_stats() -> WorkingStats {
    let mut ws = read_state(|s| s.data.ledger_indexer.working_stats.clone());
    // Populate directory_count from the account overviews map length
    ws.directory_count = with_overviews(|m| m.len());
    ws
}
