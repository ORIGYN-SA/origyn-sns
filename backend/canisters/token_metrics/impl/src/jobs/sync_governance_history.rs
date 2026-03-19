use crate::state::{
    read_state, with_gov_stake_history, with_gov_stake_history_mut, with_history,
    with_voting_power_ratio_mut,
};
use crate::utils::{principal_account_range, text_to_account, text_to_principal};
use bity_ic_canister_time::run_now_then_interval;
use std::collections::BTreeMap;
use std::time::Duration;
use token_metrics_api::types::ledger_indexer::{AccountDayKey, HistoryData};
use tracing::warn;
use types::Milliseconds;

const SYNC_GOVERNANCE_HISTORY_INTERVAL: Milliseconds = 12 * 3_600 * 1_000;

/// SNS launch date: 2024-06-05 00:00:00 UTC (Unix seconds)
const SNS_LAUNCH_TIMESTAMP: u64 = 1_717_545_600;

/// Origyn Foundation's total voting power post-SNS: 1 billion OGY in e8s
const ORIGYN_VOTING_POWER_POST_SNS: u64 = 1_000_000_000 * 100_000_000;

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

    let diff = balance_difference(principal_history, treasury_history);

    // Write to stable map
    with_gov_stake_history_mut(|m| {
        m.clear_new();
        for (day, hd) in &diff {
            m.insert(*day, hd.clone());
        }
    });

    // We want to sync voting stats now because we rely on stake history
    sync_voting_stats_job();
}

/// Read principal history via range query over all subaccounts of the principal.
fn get_local_principal_history(account: &str) -> Vec<(u64, HistoryData)> {
    let principal = match text_to_principal(account) {
        Some(p) => p,
        None => return Vec::new(),
    };

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
    let acct = match text_to_account(account) {
        Some(a) => a,
        None => return Vec::new(),
    };

    let start_key = AccountDayKey {
        account: acct,
        day: 0,
    };
    let end_key = AccountDayKey {
        account: acct,
        day: u64::MAX,
    };

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
    let map2: BTreeMap<u64, u128> = vec2.into_iter().map(|(d, h)| (d, h.balance)).collect();

    vec1.into_iter()
        .map(|(day, h1)| {
            let balance = h1
                .balance
                .saturating_sub(map2.get(&day).copied().unwrap_or(0));
            (day, HistoryData { balance })
        })
        .collect()
}

pub fn sync_voting_stats_job() {
    // Read stake history from stable map
    let stake_history: Vec<(u64, HistoryData)> =
        with_gov_stake_history(|m| m.iter().map(|e| (*e.key(), e.value())).collect());

    // Write voting power ratio to stable map
    with_voting_power_ratio_mut(|m| {
        m.clear_new();
        for (timestamp, history_data) in &stake_history {
            let origyn_voting_power = if *timestamp >= SNS_LAUNCH_TIMESTAMP {
                ORIGYN_VOTING_POWER_POST_SNS
            } else {
                0u64
            };
            let ratio = if history_data.balance > 0 {
                (((origyn_voting_power as f64) / (history_data.balance as f64)) * 10000.0) as u64
            } else {
                0
            };
            m.insert(*timestamp, ratio);
        }
    });
}
