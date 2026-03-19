use std::cell::RefCell;
use std::time::Duration;
use token_metrics_api::types::ledger_indexer::{ProcessedTX, StatsType};
use tracing::{error, info};
use crate::state::{mutate_state, read_state};
use super::{
    fetch_data::dfinity_icrc2::t2_download_transactions,
    process_data::{
        process_index::process_smtx_to_index,
        small_tx::process_transactions,
        time_stats::calculate_time_stats,
    },
    state::with_transaction_cache_mut,
};

thread_local! {
    static TIMER_IDS: RefCell<Vec<ic_cdk_timers::TimerId>> = RefCell::new(Vec::new());
}

/// Start the indexer processing loop at the given interval.
pub fn start_processing_timer(secs: u64) {
    let duration = Duration::from_secs(secs);
    let timer_id = ic_cdk_timers::set_timer_interval(duration, || {
        schedule_data_processing()
    });
    TIMER_IDS.with(|ids| ids.borrow_mut().push(timer_id));
    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.timer_active = true;
    });
    info!("Indexer timer started with {}s interval", secs);
}

/// Stop all indexer timers.
pub fn stop_all_timers() {
    TIMER_IDS.with(|ids| {
        for id in ids.borrow().iter() {
            ic_cdk_timers::clear_timer(*id);
        }
        ids.borrow_mut().clear();
    });
    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.timer_active = false;
    });
    info!("All indexer timers stopped");
}

/// Main processing loop: fetch → process → index → stats.
async fn schedule_data_processing() {
    // Check if already busy
    let is_busy = read_state(|s| s.data.ledger_indexer.working_stats.is_busy);
    if is_busy {
        return;
    }
    mutate_state(|s| s.data.ledger_indexer.working_stats.is_busy = true);

    // Download latest transactions
    let result = t2_download_transactions().await;

    match result {
        Ok(txs) => {
            if txs.is_empty() {
                let time = ic_cdk::api::time();
                mutate_state(|s| {
                    s.data.ledger_indexer.working_stats.last_update_time = time;
                    s.data.ledger_indexer.working_stats.is_busy = false;
                });
                return;
            }

            // Process account-level indexing (single pass — principal queries derived at query time)
            let stx = process_transactions(&txs);
            let index_result = process_smtx_to_index(&stx);

            match index_result {
                Ok(processed_tip) => {
                    // Store transactions in cache
                    store_transactions_in_cache(&txs);

                    let tip = read_state(|s| s.data.ledger_indexer.working_stats.ledger_tip_of_chain);
                    let up_to_date = processed_tip + 1 >= tip;

                    let next = processed_tip + 1;
                    let time = ic_cdk::api::time();
                    mutate_state(|s| {
                        s.data.ledger_indexer.working_stats.next_block = next;
                        s.data.ledger_indexer.working_stats.last_update_time = time;
                        s.data.ledger_indexer.working_stats.is_upto_date = up_to_date;
                    });

                    if up_to_date {
                        // Calculate daily and hourly stats
                        calculate_daily_stats();
                        calculate_hourly_stats();
                    }
                }
                Err(e) => {
                    error!("Error processing account index: {}", e);
                }
            }
        }
        Err(e) => {
            error!("Error downloading transactions: {}", e);
        }
    }

    mutate_state(|s| s.data.ledger_indexer.working_stats.is_busy = false);
}

fn store_transactions_in_cache(txs: &[ProcessedTX]) {
    with_transaction_cache_mut(|m| {
        for tx in txs {
            m.insert(tx.block, tx.clone());
        }
    });
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
