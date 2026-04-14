use crate::state::with_overviews;
use crate::utils::text_to_account;
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::OverviewResponse;

#[query]
fn get_account_overview(account: String) -> Option<OverviewResponse> {
    let acct = text_to_account(&account)?;
    with_overviews(|m| m.get(&acct).map(Into::into))
}
