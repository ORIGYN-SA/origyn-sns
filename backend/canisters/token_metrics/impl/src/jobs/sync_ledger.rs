use crate::indexing::{fetch_icrc2::t2_download_and_process, time_stats::calculate_time_stats};
use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::run_now_then_interval;
use std::time::Duration;
use token_metrics_api::types::ledger_indexer::StatsType;
use tracing::{error, info, warn};
use types::Milliseconds;

const SYNC_LEDGER_INTERVAL: Milliseconds = 60 * 1_000;
/// Five minutes in nanoseconds — generous ceiling for a single sync run.
const BUSY_TIMEOUT_NS: u64 = 5 * 60 * 1_000_000_000;

pub fn start_job() {
    info!("Indexer timer started with 60s interval");
    run_now_then_interval(Duration::from_millis(SYNC_LEDGER_INTERVAL), run);
}

pub fn run() {
    let (is_busy, busy_since) = read_state(|s| {
        let ws = &s.data.ledger_indexer.working_stats;
        (ws.is_busy, ws.busy_since)
    });

    if is_busy {
        let now = ic_cdk::api::time();
        let elapsed = now.saturating_sub(busy_since);
        if elapsed < BUSY_TIMEOUT_NS {
            warn!("sync_ledger: skipping — previous run still busy");
            return;
        }
        warn!(
            "sync_ledger: busy flag stale for {}s — force-clearing",
            elapsed / 1_000_000_000
        );
        mutate_state(|s| {
            s.data.ledger_indexer.working_stats.is_busy = false;
            s.data.ledger_indexer.working_stats.busy_since = 0;
        });
    }

    crate::jobs::record_job_started("sync_ledger", 60);
    ic_cdk::futures::spawn(async {
        process_ledger_sync().await;
        crate::jobs::record_job_completed("sync_ledger");
    });
}

/// Main processing loop: download + process each chunk within the IC instruction limit.
async fn process_ledger_sync() {
    let next_block_before = read_state(|s| s.data.ledger_indexer.working_stats.next_block);
    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.is_busy = true;
        s.data.ledger_indexer.working_stats.busy_since = ic_cdk::api::time();
    });
    info!("sync_ledger: starting");

    match t2_download_and_process().await {
        Ok(()) => {
            let (is_upto_date, next_block_after) = read_state(|s| {
                (
                    s.data.ledger_indexer.working_stats.is_upto_date,
                    s.data.ledger_indexer.working_stats.next_block,
                )
            });
            let blocks_advanced = next_block_after > next_block_before;

            if is_upto_date {
                // Stats calculation and dependent job triggering run in a separate
                // spawned task so they don't share the instruction budget with the
                // last chunk's processing (which already consumed most of it).
                //
                // Stats are gated on actual block progress: if no new transactions
                // were processed this tick, stats can't have changed, so recomputing
                // them is pure waste. This avoids ~50 T cycles/day of wasted scans
                // over the full StableBTreeMap<u64, ProcessedTX> when the chain is idle.
                if blocks_advanced {
                    info!("sync_ledger: up to date, scheduling stats recompute");
                    schedule_stats_recompute();
                } else {
                    info!("sync_ledger: up to date, no new blocks — skipping stats");
                }
                schedule_initial_sync_hooks_if_needed();
            }
        }
        Err(e) => {
            error!("sync_ledger: {}", e);
            crate::jobs::record_job_error("sync_ledger", &e);
        }
    }

    info!("sync_ledger: run complete, clearing busy flag");
    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.is_busy = false;
        s.data.ledger_indexer.working_stats.busy_since = 0;
    });

    // If not caught up, immediately start the next cycle instead of waiting for the timer
    let is_upto_date = read_state(|s| s.data.ledger_indexer.working_stats.is_upto_date);
    if !is_upto_date {
        info!("sync_ledger: more blocks to process, re-triggering immediately");
        run();
    }
}

/// Recompute daily + hourly stats in a deferred timer callback so they get
/// their own IC message with a full instruction budget. Caller is responsible
/// for only invoking this when there is new data to reflect.
fn schedule_stats_recompute() {
    ic_cdk_timers::set_timer(Duration::from_secs(0), async {
        info!("sync_ledger: calculating daily stats");
        calculate_daily_stats();
        info!("sync_ledger: calculating hourly stats");
        calculate_hourly_stats();
    });
}

/// One-time post-initial-sync hook: triggers the dependent jobs once the ledger
/// has caught up for the first time. Idempotent thereafter — gated on
/// `initial_sync_complete`. Must NOT be gated on per-tick block progress, since
/// a fresh upgrade where next_block already equals tip is still a valid
/// "initial sync complete" trigger.
fn schedule_initial_sync_hooks_if_needed() {
    let already_synced = read_state(|s| s.data.ledger_indexer.working_stats.initial_sync_complete);
    if already_synced {
        return;
    }
    ic_cdk_timers::set_timer(Duration::from_secs(0), async {
        info!("sync_ledger: initial sync complete, triggering dependent jobs");
        mutate_state(|s| {
            s.data.ledger_indexer.working_stats.initial_sync_complete = true;
        });
        crate::jobs::sync_governance_history::run();
        crate::jobs::update_balance_list::run();
    });
}

/// Keep the public Candid endpoint working — delegates to start_job.
pub fn start_processing_timer(_secs: u64) {
    start_job();
}

/// Stop all timers (placeholder — run_now_then_interval timers are not individually cancellable).
pub fn stop_all_timers() {
    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.timer_active = false;
    });
    info!("All indexer timers stopped");
}

fn calculate_daily_stats() {
    let time_now = ic_cdk::api::time();
    let days_nano = read_state(|s| s.data.ledger_indexer.block_cache_config.days_nano);
    let process_from = time_now.saturating_sub(days_nano);
    let stats = calculate_time_stats(process_from, StatsType::Daily, time_now);
    mutate_state(|s| {
        s.data.ledger_indexer.daily_stats = stats;
    });
}

fn calculate_hourly_stats() {
    let time_now = ic_cdk::api::time();
    let hours_nano = read_state(|s| s.data.ledger_indexer.block_cache_config.hours_nano);
    let process_from = time_now.saturating_sub(hours_nano);
    let stats = calculate_time_stats(process_from, StatsType::Hourly, time_now);
    mutate_state(|s| {
        s.data.ledger_indexer.hourly_stats = stats;
    });
}
