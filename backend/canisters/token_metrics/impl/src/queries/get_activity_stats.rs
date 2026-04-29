use crate::state::with_activity_snapshots;
use ic_cdk_macros::query;
pub use token_metrics_api::types::ledger_indexer::ActivitySnapshot;

#[query]
fn get_activity_stats(days: u64) -> Vec<ActivitySnapshot> {
    with_activity_snapshots(|v| {
        let len = v.len();
        if len == 0 {
            return Vec::new();
        }
        let start = if days as u64 >= len {
            0
        } else {
            len - days as u64
        };
        (start..len).filter_map(|i| v.get(i)).collect()
    })
}
