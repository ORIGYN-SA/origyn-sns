use crate::utils::{collect_account_holders, paginate_sorted};
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::HolderBalanceResponseCompat;

#[query]
fn get_top_account_holders(number_to_return: u64) -> Vec<HolderBalanceResponseCompat> {
    paginate_sorted(collect_account_holders(), 0, number_to_return)
        .into_iter()
        .map(Into::into)
        .collect()
}
