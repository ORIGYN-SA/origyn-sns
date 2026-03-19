use std::collections::BTreeMap;
use bity_ic_canister_time::run_now_then_interval;
use token_metrics_api::types::ledger_indexer::{AccountDayKey, HistoryData};
use std::time::Duration;
use tracing::{info, warn};
use types::Milliseconds;
use crate::state::{mutate_state, read_state};

const SYNC_GOVERNANCE_HISTORY_INTERVAL: Milliseconds = 12 * 3_600 * 1_000;

pub fn start_job() {
    run_now_then_interval(Duration::from_millis(SYNC_GOVERNANCE_HISTORY_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(sync_governance_history())
}

pub async fn sync_governance_history() {
    let sns_governance_canister_id = read_state(|state| state.data.sns_governance_canister);
    let treasury_account = read_state(|state| state.data.treasury_account.clone());

    let principal_history = get_local_principal_history(&sns_governance_canister_id.to_string());
    let treasury_history = get_local_account_history(&treasury_account);

    if principal_history.is_empty() || treasury_history.is_empty() {
        warn!("Ledger indexer not yet populated — skipping governance history sync");
        return;
    }

    mutate_state(|state| {
        state.data.gov_stake_history = balance_difference(
            principal_history,
            treasury_history,
        );
    });
    // We want to sync voting stats now because we rely on stake history
    sync_voting_stats_job();
}

/// Read principal history via range query over all subaccounts of the principal.
fn get_local_principal_history(account: &str) -> Vec<(u64, HistoryData)> {
    use crate::ledger_indexer::state::with_history;
    use crate::ledger_indexer::utils::{principal_account_range, text_to_principal};

    let principal = match text_to_principal(account) {
        Some(p) => p,
        None => return Vec::new(),
    };

    let (start_acct, end_acct) = principal_account_range(principal);
    let start_key = AccountDayKey { account: start_acct, day: 0 };
    let end_key = AccountDayKey { account: end_acct, day: u64::MAX };

    with_history(|m| {
        let mut by_day: BTreeMap<u64, HistoryData> = BTreeMap::new();
        for entry in m.range(start_key..=end_key) {
            let k = entry.key();
            let v = entry.value();
            by_day
                .entry(k.day)
                .and_modify(|agg| *agg = agg.clone() + v.clone())
                .or_insert(v);
        }
        by_day.into_iter().collect()
    })
}

/// Read account history directly from the local ledger indexer's stable memory.
fn get_local_account_history(account: &str) -> Vec<(u64, HistoryData)> {
    use crate::ledger_indexer::state::with_history;
    use crate::ledger_indexer::utils::text_to_account;

    let acct = match text_to_account(account) {
        Some(a) => a,
        None => return Vec::new(),
    };

    let start_key = AccountDayKey { account: acct, day: 0 };
    let end_key = AccountDayKey { account: acct, day: u64::MAX };

    with_history(|m| {
        m.range(start_key..=end_key)
            .map(|entry| (entry.key().day, entry.value()))
            .collect()
    })
}

fn balance_difference(
    vec1: Vec<(u64, HistoryData)>,
    vec2: Vec<(u64, HistoryData)>,
) -> Vec<(u64, HistoryData)> {
    let mut result: Vec<(u64, HistoryData)> = Vec::new();
    for (index, item) in vec1.iter().enumerate() {
        let data1 = item.clone();
        let key1 = data1.0;
        let history1 = data1.1;

        let data2 = vec2[index].clone();
        let history2 = data2.1;
        result.push((key1, HistoryData { balance: history1.balance - history2.balance }));
    }

    result
}

pub fn sync_voting_stats_job() {
    // We consider the origyn's voting power as 0 before the SNS
    // and as 1 bilion after
    let cutoff_time = 1717545600u64; // 2024-06-05 00:00:00 UTC

    let stake_history = read_state(|state| state.data.gov_stake_history.clone());

    let voting_power_ratio: Vec<(u64, u64)> = stake_history
        .iter()
        .map(|(timestamp, history_data)| {
            let origyn_voting_power = if *timestamp >= cutoff_time {
                1_000_000_000u64 * 100_000_000u64
            } else {
                0u64
            };
            let ratio = if history_data.balance > 0 {
                (((origyn_voting_power as f64) / (history_data.balance as f64)) * 10000.0) as u64
            } else {
                0
            };
            (*timestamp, ratio)
        })
        .collect();

    mutate_state(|state| {
        state.data.voting_power_ratio_history = voting_power_ratio;
    })
}
