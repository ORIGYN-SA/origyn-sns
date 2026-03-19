use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::HolderBalanceResponse;
use crate::ledger_indexer::state::with_overviews;
use crate::ledger_indexer::utils::account_to_text;

#[query]
fn get_top_account_holders(number_to_return: u64) -> Vec<HolderBalanceResponse> {
    let mut all: Vec<HolderBalanceResponse> = with_overviews(|m| {
        m.iter()
            .map(|entry| HolderBalanceResponse {
                holder: account_to_text(entry.key()),
                data: entry.value(),
            })
            .collect()
    });
    all.sort_by(|a, b| b.data.balance.cmp(&a.data.balance));
    all.truncate(number_to_return as usize);
    all
}
