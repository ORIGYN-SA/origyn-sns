use crate::state::with_overviews;
use crate::utils::text_to_account;
use ic_cdk_macros::query;
pub use token_metrics_api::types::ledger_indexer::Overview;

#[query]
fn get_account_overview(account: String) -> Option<Overview> {
    let acct = text_to_account(&account)?;
    with_overviews(|m| m.get(&acct))
}
