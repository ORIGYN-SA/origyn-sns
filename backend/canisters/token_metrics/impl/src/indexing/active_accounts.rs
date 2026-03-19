use crate::state::{mutate_state, read_state, with_activity_snapshots_mut, with_overviews};
use token_metrics_api::types::ledger_indexer::{ActivitySnapshot, DAY_AS_NANOS};

/// Take an activity snapshot and advance the window.
pub fn push_activity_snapshot() -> (u64, u64) {
    let accounts_count = with_overviews(|m| m.len());
    // Principal count derived from account map: count unique owners
    let principals_count = count_unique_principals();

    let (start, end, active_accounts, active_principals) = read_state(|s| {
        let li = &s.data.ledger_indexer;
        (
            li.activity_chunk_start_time,
            li.activity_chunk_end_time,
            li.activity_accounts_count,
            li.activity_principals_count,
        )
    });

    let snapshot = ActivitySnapshot {
        start_time: start,
        end_time: end,
        total_unique_accounts: accounts_count,
        total_unique_principals: principals_count,
        accounts_active_during_snapshot: active_accounts,
        principals_active_during_snapshot: active_principals,
    };

    with_activity_snapshots_mut(|v| {
        v.push(&snapshot);
    });

    // Advance window
    let new_start = end;
    let new_end = new_start + DAY_AS_NANOS;
    mutate_state(|s| {
        s.data.ledger_indexer.activity_chunk_start_time = new_start;
        s.data.ledger_indexer.activity_chunk_end_time = new_end;
        s.data.ledger_indexer.activity_accounts_count = 0;
        s.data.ledger_indexer.activity_principals_count = 0;
    });

    (new_start, new_end)
}

/// Push a padding snapshot (for days with no transactions).
pub fn push_padding_snapshot() -> (u64, u64) {
    let accounts_count = with_overviews(|m| m.len());
    let principals_count = count_unique_principals();

    let (start, end) = read_state(|s| {
        let li = &s.data.ledger_indexer;
        (li.activity_chunk_start_time, li.activity_chunk_end_time)
    });

    let snapshot = ActivitySnapshot {
        start_time: start,
        end_time: end,
        total_unique_accounts: accounts_count,
        total_unique_principals: principals_count,
        accounts_active_during_snapshot: 0,
        principals_active_during_snapshot: 0,
    };

    with_activity_snapshots_mut(|v| {
        v.push(&snapshot);
    });

    let new_start = end;
    let new_end = new_start + DAY_AS_NANOS;
    mutate_state(|s| {
        s.data.ledger_indexer.activity_chunk_start_time = new_start;
        s.data.ledger_indexer.activity_chunk_end_time = new_end;
        s.data.ledger_indexer.activity_accounts_count = 0;
        s.data.ledger_indexer.activity_principals_count = 0;
    });

    (new_start, new_end)
}

/// Count unique principals by iterating the overviews map.
fn count_unique_principals() -> u64 {
    with_overviews(|m| {
        let mut last_owner = None;
        let mut count = 0u64;
        for entry in m.iter() {
            let account = entry.key();
            if last_owner.as_ref() != Some(&account.owner) {
                count += 1;
                last_owner = Some(account.owner);
            }
        }
        count
    })
}

/// Nearest past day start in nanos.
pub fn nearest_past_day_start(time_nano: u64) -> u64 {
    time_nano - (time_nano % DAY_AS_NANOS)
}

/// Next midnight after the given time.
pub fn next_midnight_time(time_now: u64) -> u64 {
    nearest_past_day_start(time_now) + DAY_AS_NANOS
}

/// Initialize activity stats from first block time.
pub fn init_activity_stats(first_block_time: u64) -> u64 {
    let end_time = next_midnight_time(first_block_time);
    mutate_state(|s| {
        s.data.ledger_indexer.activity_chunk_start_time = first_block_time;
        s.data.ledger_indexer.activity_chunk_end_time = end_time;
    });
    end_time
}
