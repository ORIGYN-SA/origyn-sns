use std::collections::BTreeMap;
use candid::Principal;
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::{HolderBalanceResponse, Overview};
use crate::ledger_indexer::state::with_overviews;

#[query]
fn get_top_principal_holders(number_to_return: u64) -> Vec<HolderBalanceResponse> {
    let mut all: Vec<HolderBalanceResponse> = with_overviews(|m| {
        let mut by_principal: BTreeMap<Principal, Overview> = BTreeMap::new();
        for entry in m.iter() {
            let account = entry.key();
            let overview = entry.value();
            by_principal
                .entry(account.owner)
                .and_modify(|agg| *agg = *agg + overview)
                .or_insert(overview);
        }
        by_principal
            .into_iter()
            .map(|(principal, overview)| HolderBalanceResponse {
                holder: principal.to_text(),
                data: overview,
            })
            .collect()
    });
    all.sort_by(|a, b| b.data.balance.cmp(&a.data.balance));
    all.truncate(number_to_return as usize);
    all
}
