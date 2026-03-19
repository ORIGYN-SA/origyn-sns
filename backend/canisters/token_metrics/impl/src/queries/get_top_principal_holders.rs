use crate::utils::{aggregate_overviews_by_principal, paginate_sorted};
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::HolderBalanceResponse;

#[query]
fn get_top_principal_holders(number_to_return: u64) -> Vec<HolderBalanceResponse> {
    paginate_sorted(aggregate_overviews_by_principal(), 0, number_to_return)
}
