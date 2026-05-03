use crate::state::with_history;
use crate::utils::{nearest_day_start, principal_account_range, text_to_principal};
use ic_cdk_macros::query;
use std::collections::BTreeMap;
use token_metrics_api::types::ledger_indexer::{
    AccountDayKey, GetAccountHistoryArgs, HistoryData, DAY_AS_NANOS,
};

#[query]
fn get_principal_history(args: GetAccountHistoryArgs) -> Vec<(u64, HistoryData)> {
    let principal = match text_to_principal(&args.account) {
        Some(p) => p,
        None => return Vec::new(),
    };

    let time_now = ic_cdk::api::time();
    let days_nano = args.days * DAY_AS_NANOS;
    let start_day = nearest_day_start(time_now.saturating_sub(days_nano)) / 86400 / 1_000_000_000;

    let (start_acct, end_acct) = principal_account_range(principal);
    let start_key = AccountDayKey {
        account: start_acct,
        day: 0,
    };
    let end_key = AccountDayKey {
        account: end_acct,
        day: u64::MAX,
    };

    with_history(|m| {
        let mut by_day: BTreeMap<u64, HistoryData> = BTreeMap::new();
        for entry in m.range(start_key..=end_key) {
            let k = entry.key();
            let v = entry.value();
            if k.day >= start_day {
                by_day
                    .entry(k.day)
                    .and_modify(|agg| *agg = agg.clone() + v.clone())
                    .or_insert(v);
            }
        }
        by_day.into_iter().collect()
    })
}
