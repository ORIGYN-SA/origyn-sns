use crate::state::with_transaction_cache;
use crate::utils::{nearest_day_start, nearest_past_hour, parse_icrc_account};
use token_metrics_api::types::ledger_indexer::{
    ProcessedTX, StatsType, TimeChunkStats, TimeStats, TotCntAvg, TransactionType, DAY_AS_NANOS,
    HOUR_AS_NANOS, STATS_RETURN_LENGTH,
};

/// Calculate time-based stats from the transaction cache.
pub fn calculate_time_stats(process_from: u64, mode: StatsType, time_now: u64) -> TimeStats {
    // Collect relevant txs from the transaction cache
    let array: Vec<ProcessedTX> = with_transaction_cache(|m| {
        m.iter()
            .map(|entry| entry.value())
            .filter(|tx| tx.tx_time >= process_from)
            .collect()
    });

    if array.is_empty() {
        return TimeStats::default();
    }

    let mut all_accounts: Vec<String> = Vec::new();
    let mut all_principals: Vec<String> = Vec::new();
    let mut mint_count: u128 = 0;
    let mut mint_value: u128 = 0;
    let mut burn_count: u128 = 0;
    let mut burn_value: u128 = 0;
    let mut transfer_count: u128 = 0;
    let mut transfer_value: u128 = 0;
    let mut approve_count: u128 = 0;
    let mut approve_value: u128 = 0;
    let mut total_value: u128 = 0;
    let mut total_txs: u128 = 0;
    let mut all_mints: Vec<ProcessedTX> = Vec::new();
    let mut all_burns: Vec<ProcessedTX> = Vec::new();
    let mut all_transfers: Vec<ProcessedTX> = Vec::new();

    for tx in &array {
        // Collect accounts and principals
        if tx.from_account != "Token Ledger" {
            all_accounts.push(tx.from_account.clone());
            if let Some(parsed) = parse_icrc_account(&tx.from_account) {
                all_principals.push(parsed.0);
            }
        }
        if tx.to_account != "Token Ledger" {
            all_accounts.push(tx.to_account.clone());
            if let Some(parsed) = parse_icrc_account(&tx.to_account) {
                all_principals.push(parsed.0);
            }
        }

        match tx.tx_type.as_str() {
            x if x == TransactionType::Mint.as_str() => {
                mint_count += 1;
                mint_value = mint_value.saturating_add(tx.tx_value);
                all_mints.push(tx.clone());
            }
            x if x == TransactionType::Burn.as_str() => {
                burn_count += 1;
                burn_value = burn_value.saturating_add(tx.tx_value);
                all_burns.push(tx.clone());
            }
            x if x == TransactionType::Transfer.as_str() => {
                transfer_count += 1;
                transfer_value = transfer_value.saturating_add(tx.tx_value);
                all_transfers.push(tx.clone());
            }
            x if x == TransactionType::Approve.as_str() => {
                approve_count += 1;
                approve_value = approve_value.saturating_add(tx.tx_value);
            }
            _ => {}
        }

        if tx.tx_type.as_str() != TransactionType::Approve.as_str() {
            total_value = total_value.saturating_add(tx.tx_value);
        }
        total_txs += 1;
    }

    let count_over_time = calculate_time_chunk_stats(time_now, process_from, &mode, &array);

    let top_mints = top_x_by_txvalue(all_mints, STATS_RETURN_LENGTH);
    let top_burns = top_x_by_txvalue(all_burns, STATS_RETURN_LENGTH);
    let top_transfers = top_x_by_txvalue(all_transfers, STATS_RETURN_LENGTH);

    all_accounts.sort_unstable();
    all_accounts.dedup();
    all_principals.sort_unstable();
    all_principals.dedup();

    TimeStats {
        total_transaction_count: total_txs,
        total_transaction_value: total_value,
        total_transaction_average: if total_txs > 0 {
            (total_value as f64) / (total_txs as f64)
        } else {
            0.0
        },
        total_unique_accounts: all_accounts.len() as u64,
        total_unique_principals: all_principals.len() as u64,
        most_active_accounts: Vec::new(),
        most_active_principals: Vec::new(),
        burn_stats: TotCntAvg {
            total_value: burn_value,
            count: burn_count,
            average: if burn_count > 0 {
                (burn_value as f64) / (burn_count as f64)
            } else {
                0.0
            },
        },
        mint_stats: TotCntAvg {
            total_value: mint_value,
            count: mint_count,
            average: if mint_count > 0 {
                (mint_value as f64) / (mint_count as f64)
            } else {
                0.0
            },
        },
        transfer_stats: TotCntAvg {
            total_value: transfer_value,
            count: transfer_count,
            average: if transfer_count > 0 {
                (transfer_value as f64) / (transfer_count as f64)
            } else {
                0.0
            },
        },
        approve_stats: TotCntAvg {
            total_value: approve_value,
            count: approve_count,
            average: if approve_count > 0 {
                (approve_value as f64) / (approve_count as f64)
            } else {
                0.0
            },
        },
        count_over_time,
        top_mints,
        top_burns,
        top_transfers,
    }
}

fn calculate_time_chunk_stats(
    time_now: u64,
    process_from: u64,
    mode: &StatsType,
    txs: &[ProcessedTX],
) -> Vec<TimeChunkStats> {
    if txs.is_empty() {
        return vec![TimeChunkStats::default()];
    }

    let (chunks_needed, nearest_past_x, x_in_nanos) = match mode {
        StatsType::Hourly => {
            let chunks = ((time_now - process_from) as f64 / HOUR_AS_NANOS as f64).ceil() as u32;
            (chunks, nearest_past_hour(time_now), HOUR_AS_NANOS)
        }
        StatsType::Daily => {
            let chunks = ((time_now - process_from) as f64 / DAY_AS_NANOS as f64).ceil() as u32;
            (chunks, nearest_day_start(time_now), DAY_AS_NANOS)
        }
    };

    let mut count_over_time = Vec::new();
    let mut start_chunk = 0u64;

    for i in 0..chunks_needed {
        let end_chunk;
        if i == 0 {
            start_chunk = if time_now == nearest_past_x {
                nearest_past_x - x_in_nanos
            } else {
                nearest_past_x
            };
            end_chunk = time_now;
        } else {
            let prev_start = start_chunk;
            start_chunk = prev_start - x_in_nanos;
            end_chunk = prev_start;
        }

        let mut total_count = 0u64;
        let mut mint_count = 0u64;
        let mut burn_count = 0u64;
        let mut transfer_count = 0u64;
        let mut approve_count = 0u64;

        for tx in txs {
            if tx.tx_time >= start_chunk && tx.tx_time < end_chunk {
                total_count += 1;
                match tx.tx_type.as_str() {
                    x if x == TransactionType::Mint.as_str() => mint_count += 1,
                    x if x == TransactionType::Burn.as_str() => burn_count += 1,
                    x if x == TransactionType::Transfer.as_str() => transfer_count += 1,
                    x if x == TransactionType::Approve.as_str() => approve_count += 1,
                    _ => {}
                }
            }
            if tx.tx_time > end_chunk {
                break;
            }
        }

        count_over_time.push(TimeChunkStats {
            start_time: start_chunk,
            end_time: end_chunk,
            total_count,
            mint_count,
            transfer_count,
            burn_count,
            approve_count,
        });
    }

    count_over_time
}

fn top_x_by_txvalue(mut txs: Vec<ProcessedTX>, limit: usize) -> Vec<ProcessedTX> {
    txs.sort_by(|a, b| b.tx_value.cmp(&a.tx_value));
    txs.truncate(limit);
    txs
}
