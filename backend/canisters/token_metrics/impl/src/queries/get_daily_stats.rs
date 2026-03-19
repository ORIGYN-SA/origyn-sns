use crate::state::read_state;
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::TimeStats;

#[query]
fn get_daily_stats() -> TimeStats {
    read_state(|s| s.data.ledger_indexer.daily_stats.clone())
}
