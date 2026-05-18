use crate::state::{
    read_state, with_gov_stake_history, with_gov_stake_history_mut, with_history,
    with_voting_power_ratio_mut,
};
use crate::utils::{principal_account_range, text_to_account};
use bity_ic_canister_time::run_now_then_interval;
use candid::Principal;
use std::collections::{BTreeMap, BTreeSet};
use std::time::Duration;
use token_metrics_api::types::ledger_indexer::{AccountDayKey, HistoryData, LedgerAccount};
use tracing::{info, warn};
use types::Milliseconds;

const SYNC_GOVERNANCE_HISTORY_INTERVAL: Milliseconds = 12 * 3_600 * 1_000;

/// SNS launch day (Unix days since 1970-01-01): 2024-06-05.
/// Equivalent to 1_717_545_600 / 86_400. The gov stake history map is keyed by
/// day, so this constant must be in days, not seconds.
const SNS_LAUNCH_DAY: u64 = 19_878;

/// Origyn Foundation's total voting power post-SNS: 1 billion OGY in e8s
const ORIGYN_VOTING_POWER_POST_SNS: u64 = 1_000_000_000 * 100_000_000;

pub fn start_job() {
    run_now_then_interval(Duration::from_millis(SYNC_GOVERNANCE_HISTORY_INTERVAL), run);
}

pub fn run() {
    crate::jobs::record_job_started("sync_governance_history", 43_200);
    ic_cdk::futures::spawn(async {
        sync_governance_history().await;
        crate::jobs::record_job_completed("sync_governance_history");
    })
}

pub async fn sync_governance_history() {
    let sns_governance_canister_id = read_state(|state| state.data.sns_governance_canister);
    let treasury_account = read_state(|state| state.data.treasury_account.clone());

    let principal_history = get_local_principal_history(sns_governance_canister_id);
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

    let latest = diff.last();
    info!(
        days_written = diff.len(),
        latest_day = latest.map(|(d, _)| *d).unwrap_or(0),
        latest_balance_e8s = %latest.map(|(_, h)| h.balance).unwrap_or(0),
        "sync_governance_history: rebuilt stake history"
    );

    // We want to sync voting stats now because we rely on stake history
    sync_voting_stats_job();
}

/// Given each subaccount's per-day end-of-day-balance map, return the per-day
/// total across all subaccounts. For each day that appears in any subaccount,
/// the total includes the latest known balance on-or-before that day for every
/// subaccount (forward-fill across days with no transaction).
fn forward_fill_total_per_day(
    per_account: BTreeMap<LedgerAccount, BTreeMap<u64, u128>>,
) -> Vec<(u64, HistoryData)> {
    let mut all_days: BTreeSet<u64> = BTreeSet::new();
    for days_map in per_account.values() {
        all_days.extend(days_map.keys());
    }

    let mut result: Vec<(u64, HistoryData)> = Vec::with_capacity(all_days.len());
    for day in all_days {
        let mut total: u128 = 0;
        for days_map in per_account.values() {
            if let Some((_, balance)) = days_map.range(..=day).next_back() {
                total = total.saturating_add(*balance);
            }
        }
        result.push((day, HistoryData { balance: total }));
    }
    result
}

/// Read principal history via range query over all subaccounts of the principal.
fn get_local_principal_history(principal: Principal) -> Vec<(u64, HistoryData)> {
    let (start_acct, end_acct) = principal_account_range(principal);
    let start_key = AccountDayKey {
        account: start_acct,
        day: 0,
    };
    let end_key = AccountDayKey {
        account: end_acct,
        day: u64::MAX,
    };

    let per_account: BTreeMap<LedgerAccount, BTreeMap<u64, u128>> = with_history(|m| {
        let mut per_account: BTreeMap<LedgerAccount, BTreeMap<u64, u128>> = BTreeMap::new();
        for entry in m.range(start_key..=end_key) {
            let k = entry.key();
            let v = entry.value();
            per_account
                .entry(k.account)
                .or_default()
                .insert(k.day, v.balance);
        }
        per_account
    });

    forward_fill_total_per_day(per_account)
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
    // Treasury history is sparse, so use a range query to forward-fill: on days
    // without a treasury transaction, subtract the last known treasury balance
    // rather than zero.
    let treasury_map: BTreeMap<u64, u128> = vec2.into_iter().map(|(d, h)| (d, h.balance)).collect();

    vec1.into_iter()
        .map(|(day, h1)| {
            let treasury_balance = treasury_map
                .range(..=day)
                .next_back()
                .map(|(_, b)| *b)
                .unwrap_or(0);
            let balance = h1.balance.saturating_sub(treasury_balance);
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
            let origyn_voting_power = if *timestamp >= SNS_LAUNCH_DAY {
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

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;

    fn acct(byte: u8) -> LedgerAccount {
        LedgerAccount {
            owner: Principal::anonymous(),
            subaccount: Some([byte; 32]),
        }
    }

    #[test]
    fn forward_fill_carries_balance_across_idle_days() {
        // Subaccount A: deposit of 100 on day 10, then idle.
        // Subaccount B: deposit of 50 on day 15.
        // Expected: day 10 total = 100; day 15 total = 150 (A's 100 carried + B's 50).
        let mut per_account: BTreeMap<LedgerAccount, BTreeMap<u64, u128>> = BTreeMap::new();
        per_account.entry(acct(1)).or_default().insert(10, 100);
        per_account.entry(acct(2)).or_default().insert(15, 50);

        let result = forward_fill_total_per_day(per_account);

        assert_eq!(
            result,
            vec![
                (10, HistoryData { balance: 100 }),
                (15, HistoryData { balance: 150 }),
            ]
        );
    }

    #[test]
    fn forward_fill_uses_latest_balance_on_or_before_each_day() {
        // Subaccount A: 100 on day 1, then 80 on day 5 (withdrawal).
        // Subaccount B: 200 on day 3.
        // Day 1: A=100, B=0           -> 100
        // Day 3: A=100 (carried), B=200 -> 300
        // Day 5: A=80 (updated), B=200 -> 280
        let mut per_account: BTreeMap<LedgerAccount, BTreeMap<u64, u128>> = BTreeMap::new();
        let a = acct(1);
        let b = acct(2);
        per_account.entry(a).or_default().insert(1, 100);
        per_account.entry(a).or_default().insert(5, 80);
        per_account.entry(b).or_default().insert(3, 200);

        let result = forward_fill_total_per_day(per_account);

        assert_eq!(
            result,
            vec![
                (1, HistoryData { balance: 100 }),
                (3, HistoryData { balance: 300 }),
                (5, HistoryData { balance: 280 }),
            ]
        );
    }

    #[test]
    fn forward_fill_empty_input() {
        let result = forward_fill_total_per_day(BTreeMap::new());
        assert!(result.is_empty());
    }

    #[test]
    fn balance_difference_forward_fills_treasury() {
        // Principal totals: day 1 = 1000, day 2 = 1000, day 5 = 1500.
        // Treasury: day 1 = 200, then idle (no entry on day 2 or 5).
        // Expected:
        //   day 1: 1000 - 200 = 800
        //   day 2: 1000 - 200 = 800  (treasury carries)
        //   day 5: 1500 - 200 = 1300 (treasury carries)
        let principal = vec![
            (1, HistoryData { balance: 1000 }),
            (2, HistoryData { balance: 1000 }),
            (5, HistoryData { balance: 1500 }),
        ];
        let treasury = vec![(1, HistoryData { balance: 200 })];

        let diff = balance_difference(principal, treasury);

        assert_eq!(
            diff,
            vec![
                (1, HistoryData { balance: 800 }),
                (2, HistoryData { balance: 800 }),
                (5, HistoryData { balance: 1300 }),
            ]
        );
    }

    #[test]
    fn balance_difference_treasury_only_after_principal_starts() {
        // Treasury has no entry until day 3; first two days subtract 0.
        let principal = vec![
            (1, HistoryData { balance: 500 }),
            (2, HistoryData { balance: 500 }),
            (3, HistoryData { balance: 1000 }),
            (4, HistoryData { balance: 1000 }),
        ];
        let treasury = vec![(3, HistoryData { balance: 100 })];

        let diff = balance_difference(principal, treasury);

        assert_eq!(
            diff,
            vec![
                (1, HistoryData { balance: 500 }),
                (2, HistoryData { balance: 500 }),
                (3, HistoryData { balance: 900 }),
                (4, HistoryData { balance: 900 }),
            ]
        );
    }
}
