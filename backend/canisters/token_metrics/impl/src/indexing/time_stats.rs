use crate::state::with_transaction_cache;
use crate::utils::{nearest_day_start, nearest_past_hour};
use std::collections::HashSet;
use token_metrics_api::types::ledger_indexer::{
    ProcessedTX, StatsType, TimeChunkStats, TimeStats, TotCntAvg, TransactionType, DAY_AS_NANOS,
    HOUR_AS_NANOS, STATS_RETURN_LENGTH,
};

const TOKEN_LEDGER: &str = "Token Ledger";

/// Calculate time-based stats from the transaction cache.
pub fn calculate_time_stats(process_from: u64, mode: StatsType, time_now: u64) -> TimeStats {
    // Collect relevant txs from the transaction cache. The map is keyed by
    // block number, not time, so we cannot avoid the full scan here — but the
    // caller (sync_ledger) only invokes this when new blocks have actually
    // been processed, so a wasted scan on an idle chain doesn't happen.
    let array: Vec<ProcessedTX> = with_transaction_cache(|m| {
        m.iter()
            .map(|entry| entry.value())
            .filter(|tx| tx.tx_time >= process_from)
            .collect()
    });

    calculate_time_stats_from_slice(&array, process_from, mode, time_now)
}

/// Pure / testable variant. Operates on an in-memory slice so unit tests don't
/// need to set up stable memory.
fn calculate_time_stats_from_slice(
    array: &[ProcessedTX],
    process_from: u64,
    mode: StatsType,
    time_now: u64,
) -> TimeStats {
    if array.is_empty() {
        return TimeStats::default();
    }

    // Unique account / principal counts via HashSet — same `.len()` as the
    // old sort+dedup but O(N) and avoids two large allocations of String vecs.
    let mut all_accounts: HashSet<&str> = HashSet::new();
    let mut all_principals: HashSet<&str> = HashSet::new();

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

    // Per-category (value, index) pairs. Avoids cloning the full ProcessedTX
    // per row — we only clone the final top-N at the end.
    let mut mint_idx: Vec<(u128, usize)> = Vec::new();
    let mut burn_idx: Vec<(u128, usize)> = Vec::new();
    let mut transfer_idx: Vec<(u128, usize)> = Vec::new();

    let mint_str = TransactionType::Mint.as_str();
    let burn_str = TransactionType::Burn.as_str();
    let transfer_str = TransactionType::Transfer.as_str();
    let approve_str = TransactionType::Approve.as_str();

    for (i, tx) in array.iter().enumerate() {
        if tx.from_account != TOKEN_LEDGER {
            all_accounts.insert(tx.from_account.as_str());
            if let Some(principal) = principal_part(&tx.from_account) {
                all_principals.insert(principal);
            }
        }
        if tx.to_account != TOKEN_LEDGER {
            all_accounts.insert(tx.to_account.as_str());
            if let Some(principal) = principal_part(&tx.to_account) {
                all_principals.insert(principal);
            }
        }

        let tx_type = tx.tx_type.as_str();
        if tx_type == mint_str {
            mint_count += 1;
            mint_value = mint_value.saturating_add(tx.tx_value);
            mint_idx.push((tx.tx_value, i));
        } else if tx_type == burn_str {
            burn_count += 1;
            burn_value = burn_value.saturating_add(tx.tx_value);
            burn_idx.push((tx.tx_value, i));
        } else if tx_type == transfer_str {
            transfer_count += 1;
            transfer_value = transfer_value.saturating_add(tx.tx_value);
            transfer_idx.push((tx.tx_value, i));
        } else if tx_type == approve_str {
            approve_count += 1;
            approve_value = approve_value.saturating_add(tx.tx_value);
        }

        if tx_type != approve_str {
            total_value = total_value.saturating_add(tx.tx_value);
        }
        total_txs += 1;
    }

    let count_over_time = calculate_time_chunk_stats(time_now, process_from, &mode, array);

    let top_mints = top_n_clone(&mint_idx, array, STATS_RETURN_LENGTH);
    let top_burns = top_n_clone(&burn_idx, array, STATS_RETURN_LENGTH);
    let top_transfers = top_n_clone(&transfer_idx, array, STATS_RETURN_LENGTH);

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

/// Extract the principal portion of a "principal.subaccount" string.
fn principal_part(account: &str) -> Option<&str> {
    let dot = account.find('.')?;
    Some(&account[..dot])
}

/// Pick the top-N entries by value from `idx` and clone the matching txs from
/// `array`. Cheap when N << idx.len(): we sort 16-byte tuples, not 200-byte
/// `ProcessedTX` structs.
fn top_n_clone(idx: &[(u128, usize)], array: &[ProcessedTX], n: usize) -> Vec<ProcessedTX> {
    let mut idx = idx.to_vec();
    idx.sort_unstable_by(|a, b| b.0.cmp(&a.0));
    idx.iter().take(n).map(|(_, i)| array[*i].clone()).collect()
}

/// Single-pass time-bucket aggregation. Chunks are returned newest-first
/// (chunk 0 = the partial window from `nearest_past_x` to `time_now`, or the
/// full window ending at `time_now` when `time_now == nearest_past_x`),
/// matching the previous nested-loop behavior exactly.
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

    if chunks_needed == 0 {
        return vec![TimeChunkStats::default()];
    }

    // Pre-compute chunk boundaries newest-first.
    let chunks_needed = chunks_needed as usize;
    let mut count_over_time: Vec<TimeChunkStats> = Vec::with_capacity(chunks_needed);
    let mut start_chunk = if time_now == nearest_past_x {
        nearest_past_x - x_in_nanos
    } else {
        nearest_past_x
    };
    let mut end_chunk = time_now;
    for _ in 0..chunks_needed {
        count_over_time.push(TimeChunkStats {
            start_time: start_chunk,
            end_time: end_chunk,
            ..TimeChunkStats::default()
        });
        end_chunk = start_chunk;
        start_chunk = start_chunk.saturating_sub(x_in_nanos);
    }

    // Single pass: compute each tx's chunk index by arithmetic, then increment.
    let oldest_start = count_over_time[chunks_needed - 1].start_time;
    let mint_str = TransactionType::Mint.as_str();
    let burn_str = TransactionType::Burn.as_str();
    let transfer_str = TransactionType::Transfer.as_str();
    let approve_str = TransactionType::Approve.as_str();

    for tx in txs {
        if tx.tx_time < oldest_start || tx.tx_time >= time_now {
            continue;
        }
        let chunk_index = chunk_index_for(tx.tx_time, time_now, nearest_past_x, x_in_nanos);
        if chunk_index >= chunks_needed {
            continue;
        }
        let bucket = &mut count_over_time[chunk_index];
        bucket.total_count += 1;
        let ty = tx.tx_type.as_str();
        if ty == mint_str {
            bucket.mint_count += 1;
        } else if ty == burn_str {
            bucket.burn_count += 1;
        } else if ty == transfer_str {
            bucket.transfer_count += 1;
        } else if ty == approve_str {
            bucket.approve_count += 1;
        }
    }

    count_over_time
}

/// Map a tx timestamp to its chunk index in the newest-first chunk array.
/// Mirrors the original nested-loop semantics exactly:
/// - normal case (time_now > nearest_past_x):
///   chunk 0 = [nearest_past_x, time_now);
///   chunk k (k>=1) = [nearest_past_x - k*x, nearest_past_x - (k-1)*x).
/// - edge case (time_now == nearest_past_x):
///   chunk 0 = [nearest_past_x - x, nearest_past_x);
///   chunk k (k>=0) = [nearest_past_x - (k+1)*x, nearest_past_x - k*x).
fn chunk_index_for(tx_time: u64, time_now: u64, nearest_past_x: u64, x_in_nanos: u64) -> usize {
    if time_now == nearest_past_x {
        ((nearest_past_x - 1 - tx_time) / x_in_nanos) as usize
    } else if tx_time >= nearest_past_x {
        0
    } else {
        1 + ((nearest_past_x - 1 - tx_time) / x_in_nanos) as usize
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tx(
        block: u64,
        ty: TransactionType,
        value: u128,
        time: u64,
        from: &str,
        to: &str,
    ) -> ProcessedTX {
        ProcessedTX {
            block,
            hash: String::new(),
            tx_type: ty.to_string(),
            from_account: from.into(),
            to_account: to.into(),
            tx_value: value,
            tx_fee: None,
            tx_time: time,
            spender: None,
        }
    }

    fn principal_account(p: &str, sub_byte: u8) -> String {
        format!("{}.{:02x}{}", p, sub_byte, "00".repeat(31))
    }

    /// `chunk_index_for` mirrors the original nested loop exactly across both
    /// the normal and edge boundary cases.
    #[test]
    fn chunk_index_normal_case() {
        // time_now > nearest_past_x — chunk 0 is a partial window.
        let x = 100;
        let nearest = 1000;
        let now = 1050;
        // chunk 0: [1000, 1050)
        assert_eq!(chunk_index_for(1049, now, nearest, x), 0);
        assert_eq!(chunk_index_for(1000, now, nearest, x), 0);
        // chunk 1: [900, 1000)
        assert_eq!(chunk_index_for(999, now, nearest, x), 1);
        assert_eq!(chunk_index_for(900, now, nearest, x), 1);
        // chunk 2: [800, 900)
        assert_eq!(chunk_index_for(899, now, nearest, x), 2);
        assert_eq!(chunk_index_for(800, now, nearest, x), 2);
    }

    #[test]
    fn chunk_index_edge_case_now_equals_nearest() {
        let x = 100;
        let nearest = 1000;
        let now = 1000;
        // chunk 0: [900, 1000)
        assert_eq!(chunk_index_for(999, now, nearest, x), 0);
        assert_eq!(chunk_index_for(900, now, nearest, x), 0);
        // chunk 1: [800, 900)
        assert_eq!(chunk_index_for(899, now, nearest, x), 1);
        assert_eq!(chunk_index_for(800, now, nearest, x), 1);
    }

    #[test]
    fn top_n_clone_picks_largest_and_clones_min() {
        let txs = vec![
            tx(1, TransactionType::Transfer, 10, 100, "a", "b"),
            tx(2, TransactionType::Transfer, 50, 200, "c", "d"),
            tx(3, TransactionType::Transfer, 30, 300, "e", "f"),
        ];
        let idx = vec![(10, 0), (50, 1), (30, 2)];
        let top = top_n_clone(&idx, &txs, 2);
        assert_eq!(top.len(), 2);
        assert_eq!(top[0].tx_value, 50);
        assert_eq!(top[1].tx_value, 30);
    }

    #[test]
    fn top_n_clone_n_larger_than_input() {
        let txs = vec![tx(1, TransactionType::Mint, 7, 0, "ledger", "to")];
        let idx = vec![(7, 0)];
        let top = top_n_clone(&idx, &txs, 25);
        assert_eq!(top.len(), 1);
    }

    /// Golden output regression: hand-built input + expected TimeStats.
    /// If anyone refactors the inner loops, this catches behavior drift.
    #[test]
    fn calculate_time_stats_golden() {
        // time_now picked to leave a partial chunk 0 (now is 30 min past the hour).
        let now: u64 =
            nearest_past_hour(2 * HOUR_AS_NANOS) + HOUR_AS_NANOS + 30 * 60 * 1_000_000_000;
        let process_from = now - 3 * HOUR_AS_NANOS;

        let alice = principal_account("aaaaa-aa", 1);
        let bob = principal_account("aaaaa-aa", 2);
        let carol = principal_account("2vxsx-fae", 1);

        let txs = vec![
            // Within window, chunk 2 (oldest visible)
            tx(
                1,
                TransactionType::Mint,
                1_000,
                now - 2 * HOUR_AS_NANOS - 60_000_000_000,
                "Token Ledger",
                &alice,
            ),
            // chunk 1
            tx(
                2,
                TransactionType::Transfer,
                500,
                now - HOUR_AS_NANOS - 60_000_000_000,
                &alice,
                &bob,
            ),
            tx(
                3,
                TransactionType::Transfer,
                700,
                now - HOUR_AS_NANOS - 30_000_000_000,
                &bob,
                &carol,
            ),
            // chunk 0 (partial)
            tx(
                4,
                TransactionType::Burn,
                200,
                now - 10 * 60 * 1_000_000_000,
                &carol,
                "Token Ledger",
            ),
            tx(
                5,
                TransactionType::Approve,
                0,
                now - 5 * 60 * 1_000_000_000,
                &alice,
                &bob,
            ),
        ];

        let stats = calculate_time_stats_from_slice(&txs, process_from, StatsType::Hourly, now);

        assert_eq!(stats.total_transaction_count, 5);
        // Total value excludes Approves
        assert_eq!(stats.total_transaction_value, 1_000 + 500 + 700 + 200);
        assert_eq!(stats.mint_stats.count, 1);
        assert_eq!(stats.mint_stats.total_value, 1_000);
        assert_eq!(stats.burn_stats.count, 1);
        assert_eq!(stats.burn_stats.total_value, 200);
        assert_eq!(stats.transfer_stats.count, 2);
        assert_eq!(stats.transfer_stats.total_value, 1_200);
        assert_eq!(stats.approve_stats.count, 1);

        // alice, bob, carol all appear; "Token Ledger" is excluded.
        assert_eq!(stats.total_unique_accounts, 3);
        // Two distinct principals (aaaaa-aa and 2vxsx-fae).
        assert_eq!(stats.total_unique_principals, 2);

        // Top mints/burns/transfers must be sorted by value desc.
        assert_eq!(stats.top_mints.len(), 1);
        assert_eq!(stats.top_burns.len(), 1);
        assert_eq!(stats.top_transfers.len(), 2);
        assert_eq!(stats.top_transfers[0].tx_value, 700);
        assert_eq!(stats.top_transfers[1].tx_value, 500);

        // 4 chunks needed (ceil(3h / 1h) = 3, plus partial chunk 0... actually exactly 3 hours, so 3 chunks).
        // Re-check: (now - process_from) = 3h, so chunks_needed = ceil(3.0) = 3.
        assert!(!stats.count_over_time.is_empty());
        // Chunk 0 (most recent, partial): the burn + approve.
        let chunk0 = &stats.count_over_time[0];
        assert_eq!(chunk0.total_count, 2);
        assert_eq!(chunk0.burn_count, 1);
        assert_eq!(chunk0.approve_count, 1);
        // Chunk 1: two transfers.
        let chunk1 = &stats.count_over_time[1];
        assert_eq!(chunk1.total_count, 2);
        assert_eq!(chunk1.transfer_count, 2);
        // Chunk 2: the mint.
        let chunk2 = &stats.count_over_time[2];
        assert_eq!(chunk2.total_count, 1);
        assert_eq!(chunk2.mint_count, 1);
    }

    #[test]
    fn calculate_time_stats_empty_input() {
        let stats = calculate_time_stats_from_slice(&[], 0, StatsType::Daily, DAY_AS_NANOS);
        assert_eq!(stats.total_transaction_count, 0);
        assert_eq!(stats.total_unique_accounts, 0);
        assert!(stats.top_transfers.is_empty());
    }

    #[test]
    fn principal_part_extracts_prefix() {
        assert_eq!(
            principal_part(
                "aaaaa-aa.0000000000000000000000000000000000000000000000000000000000000000"
            ),
            Some("aaaaa-aa")
        );
        assert_eq!(principal_part("no-dot"), None);
    }
}
