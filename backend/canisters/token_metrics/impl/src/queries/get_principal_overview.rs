use crate::state::with_overviews;
use crate::utils::{principal_account_range, text_to_principal};
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::OverviewResponse;

#[query]
fn get_principal_overview(account: String) -> Option<OverviewResponse> {
    let principal = text_to_principal(&account)?;
    let (start, end) = principal_account_range(principal);
    with_overviews(|m| {
        m.range(start..=end)
            .map(|entry| entry.value())
            .reduce(|a, b| a + b)
            .map(Into::into)
    })
}
