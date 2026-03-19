use std::collections::HashSet;
use candid::Principal;
use token_metrics_api::types::ledger_indexer::LedgerAccount;
use token_metrics_api::types::ledger_indexer::{DAY_AS_NANOS, ProcessedTX, SmallTX, TransactionType};
use crate::state::{mutate_state, read_state};
use crate::ledger_indexer::{
    account_tree::create_account_if_not_exists,
    active_accounts::{init_activity_stats, push_activity_snapshot, push_padding_snapshot},
    utils::text_to_account,
};

/// Convert ProcessedTX to SmallTX with activity tracking.
/// Returns a single vec of SmallTX (account-level; principal queries are derived at query time).
pub fn process_transactions(input_vec: &[ProcessedTX]) -> Vec<SmallTX> {
    let mut activity_start_time = read_state(|s| s.data.ledger_indexer.activity_chunk_start_time);
    let mut activity_end_time = read_state(|s| s.data.ledger_indexer.activity_chunk_end_time);
    let mut active_accounts: HashSet<LedgerAccount> = HashSet::new();
    let mut active_principals: HashSet<Principal> = HashSet::new();

    let mut stx_vec: Vec<SmallTX> = Vec::new();

    for tx in input_vec {
        // Init activity stats on first block
        if tx.block == 0 {
            activity_start_time = tx.tx_time;
            activity_end_time = init_activity_stats(tx.tx_time);
        }

        // Resolve accounts directly (no directory indirection)
        let acct_from = if tx.from_account != "Token Ledger" {
            text_to_account(&tx.from_account)
        } else {
            None
        };

        let acct_to = if tx.to_account != "Token Ledger" {
            text_to_account(&tx.to_account)
        } else {
            None
        };

        let tx_type = match tx.tx_type.as_str() {
            "Transfer" => TransactionType::Transfer,
            "Mint" => TransactionType::Mint,
            "Burn" => TransactionType::Burn,
            "Approve" => TransactionType::Approve,
            _ => TransactionType::Transfer,
        };

        stx_vec.push(SmallTX {
            block: tx.block,
            time: tx.tx_time,
            from: acct_from,
            to: acct_to,
            tx_type,
            value: tx.tx_value,
            fee: tx.tx_fee,
        });

        // Create account entry for `to` so snapshot counts are correct
        if let Some(ref to_acct) = acct_to {
            create_account_if_not_exists(to_acct, tx.tx_time);
        }

        // Check for end of activity window
        if tx.tx_time > activity_end_time {
            mutate_state(|s| {
                s.data.ledger_indexer.activity_accounts_count += active_accounts.len() as u64;
                s.data.ledger_indexer.activity_principals_count += active_principals.len() as u64;
            });

            if tx.tx_time < activity_end_time + DAY_AS_NANOS {
                let times = push_activity_snapshot();
                activity_start_time = times.0;
                activity_end_time = times.1;
            } else {
                // Pad missing snapshots
                let time_since = tx.tx_time - activity_end_time;
                let missing_days = ((time_since as f64) / (DAY_AS_NANOS as f64)).ceil() as usize;
                let mut new_times = (activity_start_time, activity_end_time);
                for _ in 0..missing_days {
                    new_times = push_padding_snapshot();
                }
                activity_start_time = new_times.0;
                activity_end_time = new_times.1;
            }

            active_accounts.clear();
            active_principals.clear();
        }

        // Track active accounts in current window
        if tx.tx_time >= activity_start_time && tx.tx_time < activity_end_time {
            if let Some(ref from_acct) = acct_from {
                active_accounts.insert(*from_acct);
                active_principals.insert(from_acct.owner);
            }
            if let Some(ref to_acct) = acct_to {
                active_accounts.insert(*to_acct);
                active_principals.insert(to_acct.owner);
            }
        }
    }

    // Update final activity counts
    mutate_state(|s| {
        s.data.ledger_indexer.activity_accounts_count += active_accounts.len() as u64;
        s.data.ledger_indexer.activity_principals_count += active_principals.len() as u64;
    });

    stx_vec
}
