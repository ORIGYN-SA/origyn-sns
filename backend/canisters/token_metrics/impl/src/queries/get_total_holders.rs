use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::TotalHolderResponse;
use crate::ledger_indexer::state::with_overviews;

#[query]
fn get_total_holders() -> TotalHolderResponse {
    let (total_accounts, total_principals) = with_overviews(|m| {
        let total_accounts = m.len();
        let mut last_owner = None;
        let mut principal_count = 0u64;
        for entry in m.iter() {
            let account = entry.key();
            if last_owner.as_ref() != Some(&account.owner) {
                principal_count += 1;
                last_owner = Some(account.owner);
            }
        }
        (total_accounts, principal_count)
    });
    TotalHolderResponse {
        total_accounts,
        total_principals,
    }
}
