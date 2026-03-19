use crate::ledger_indexer::state::with_history;
use crate::ledger_indexer::utils::{nearest_day_start, text_to_account};
use ic_cdk_macros::query;
pub use token_metrics_api::types::ledger_indexer::{
    AccountDayKey, GetAccountHistoryArgs, HistoryData, DAY_AS_NANOS,
};

#[query]
fn get_account_history(args: GetAccountHistoryArgs) -> Vec<(u64, HistoryData)> {
    let account = match text_to_account(&args.account) {
        Some(a) => a,
        None => return Vec::new(),
    };

    let time_now = ic_cdk::api::time();
    let days_nano = args.days * DAY_AS_NANOS;
    let start_day = nearest_day_start(time_now.saturating_sub(days_nano)) / 86400 / 1_000_000_000;

    with_history(|m| {
        let start_key = AccountDayKey {
            account,
            day: start_day,
        };
        let end_key = AccountDayKey {
            account,
            day: u64::MAX,
        };
        m.range(start_key..=end_key)
            .map(|entry| (entry.key().day, entry.value()))
            .collect()
    })
}
