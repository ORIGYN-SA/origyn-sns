use crate::state::{
    read_state, with_history, with_history_cache, with_history_cache_mut, with_history_mut,
    with_overviews, with_overviews_mut,
};
use token_metrics_api::types::ledger_indexer::{
    AccountDayKey, HistoryBalanceCache, HistoryData, LedgerAccount, Overview, SmallTX,
};

#[derive(PartialEq)]
enum BalanceDirection {
    In,
    Out,
}

/// Process a "transfer to" (credit) transaction for the given account.
pub fn process_transfer_to(account: &LedgerAccount, stx: &SmallTX) -> Result<(), String> {
    let key = *account;
    update_history_balance(&key, stx, BalanceDirection::In);
    if let Some(mut ov) = with_overviews(|m| m.get(&key)) {
        ov.credit_account(stx.time, stx.value);
        with_overviews_mut(|m| {
            m.insert(key, ov);
        });
    } else {
        let ov = Overview::new_received(stx.time, stx.value);
        with_overviews_mut(|m| {
            m.insert(key, ov);
        });
    }
    Ok(())
}

/// Process a "transfer from" (debit) transaction for the given account.
pub fn process_transfer_from(account: &LedgerAccount, stx: &SmallTX) -> Result<(), String> {
    let key = *account;
    update_history_balance(&key, stx, BalanceDirection::Out);
    let fee = stx
        .fee
        .unwrap_or_else(|| read_state(|s| s.data.ledger_indexer.ledger_fee));
    match with_overviews(|m| m.get(&key)) {
        Some(mut ov) => {
            ov.debit_account(stx.time, stx.value, fee);
            with_overviews_mut(|m| {
                m.insert(key, ov);
            });
            Ok(())
        }
        None => Err(format!(
            "Cannot send from non-existent entry (transfer_from), block: {}",
            stx.block
        )),
    }
}

/// Process an "approve" transaction (fee is deducted, value = 0).
pub fn process_approve_from(account: &LedgerAccount, stx: &SmallTX) -> Result<(), String> {
    let key = *account;
    let zero_value_stx = SmallTX {
        block: stx.block,
        time: stx.time,
        from: stx.from,
        to: stx.to,
        tx_type: stx.tx_type.clone(),
        value: 0,
        fee: stx.fee,
    };
    update_history_balance(&key, &zero_value_stx, BalanceDirection::Out);
    let fee = stx
        .fee
        .unwrap_or_else(|| read_state(|s| s.data.ledger_indexer.ledger_fee));
    match with_overviews(|m| m.get(&key)) {
        Some(mut ov) => {
            ov.debit_account(stx.time, 0, fee);
            with_overviews_mut(|m| {
                m.insert(key, ov);
            });
            Ok(())
        }
        None => Err(format!(
            "Cannot approve from non-existent entry, block: {}",
            stx.block
        )),
    }
}

/// Create an account entry if it doesn't exist yet.
pub fn create_account_if_not_exists(account: &LedgerAccount, creation_time: u64) {
    let key = *account;
    if with_overviews(|m| m.get(&key)).is_none() {
        let ov = Overview {
            first_active: creation_time,
            last_active: creation_time,
            sent_count: 0,
            sent_value: 0,
            received_count: 0,
            received_value: 0,
            balance: 0,
            max_balance: 0,
        };
        with_overviews_mut(|m| {
            m.insert(key, ov);
        });
    }
}

// ============================================================================
// History balance tracking
// ============================================================================

fn update_history_balance(account: &LedgerAccount, stx: &SmallTX, direction: BalanceDirection) {
    let day = stx.time / 86400 / 1_000_000_000;
    let key = AccountDayKey {
        account: *account,
        day,
    };

    let fee = stx
        .fee
        .unwrap_or_else(|| read_state(|s| s.data.ledger_indexer.ledger_fee));

    let existing = with_history(|m| m.get(&key));
    match existing {
        None => {
            let prev_balance =
                with_history_cache(|m| m.get(account).map(|c| c.data.balance).unwrap_or(0));
            let new_balance = match direction {
                BalanceDirection::In => prev_balance.saturating_add(stx.value),
                BalanceDirection::Out => prev_balance.saturating_sub(stx.value).saturating_sub(fee),
            };
            let hd = HistoryData {
                balance: new_balance,
            };
            with_history_mut(|m| {
                m.insert(key, hd.clone());
            });
            with_history_cache_mut(|m| {
                m.insert(*account, HistoryBalanceCache { day, data: hd });
            });
        }
        Some(mut hd) => {
            hd.balance = match direction {
                BalanceDirection::In => hd.balance.saturating_add(stx.value),
                BalanceDirection::Out => hd.balance.saturating_sub(stx.value).saturating_sub(fee),
            };
            with_history_mut(|m| {
                m.insert(key, hd.clone());
            });
            with_history_cache_mut(|m| {
                m.insert(*account, HistoryBalanceCache { day, data: hd });
            });
        }
    }
}
