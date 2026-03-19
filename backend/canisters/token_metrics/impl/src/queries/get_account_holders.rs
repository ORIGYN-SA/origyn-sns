use crate::ledger_indexer::state::with_overviews;
use crate::ledger_indexer::utils::account_to_text;
use ic_cdk_macros::query;
pub use token_metrics_api::types::ledger_indexer::{GetAccountHoldersArgs, HolderBalanceResponse};

#[query]
fn get_account_holders(args: GetAccountHoldersArgs) -> Vec<HolderBalanceResponse> {
    let mut all: Vec<HolderBalanceResponse> = with_overviews(|m| {
        m.iter()
            .map(|entry| HolderBalanceResponse {
                holder: account_to_text(entry.key()),
                data: entry.value(),
            })
            .collect()
    });
    all.sort_by(|a, b| b.data.balance.cmp(&a.data.balance));
    let start = args.offset as usize;
    let end = (start + args.limit as usize).min(all.len());
    if start >= all.len() {
        return Vec::new();
    }
    all[start..end].to_vec()
}
