use candid::Nat;
use ic_cdk::call::Call;
use token_metrics_api::types::ledger_indexer::{
    ArchivedRange1, GetBlocksArgs1, GetTransactionsResponse, IcrcTransaction,
    ProcessedTX, TransactionRange, TransactionType, TargetArgs,
    HOUR_AS_NANOS, DAY_AS_NANOS, MAX_TOTAL_DOWNLOAD, MAX_TRANSACTION_BATCH_SIZE,
};
use tracing::info;
use crate::state::{mutate_state, read_state};
use crate::ledger_indexer::utils::{icrc_account_to_string, nat_to_u128, nat_to_u64};

/// Set target canister, fee, and decimals.
pub async fn t2_impl_set_target_canister(args: TargetArgs) -> Result<String, String> {
    let locked = read_state(|s| s.data.ledger_indexer.target_ledger_locked);
    if locked {
        return Err("Target canister can't be changed after being set. Re-install to change.".into());
    }

    let ledger_principal = candid::Principal::from_text(&args.target_ledger)
        .map_err(|e| format!("Invalid ledger principal: {}", e))?;

    // Get fee
    let fee: Nat = Call::bounded_wait(ledger_principal, "icrc1_fee")
        .await
        .map_err(|e| format!("Failed to get fee: {e}"))?
        .candid()
        .map_err(|e| format!("Failed to decode fee: {e}"))?;
    let fee = nat_to_u128(fee)?;

    // Get decimals
    let decimals: u8 = Call::bounded_wait(ledger_principal, "icrc1_decimals")
        .await
        .map_err(|e| format!("Failed to get decimals: {e}"))?
        .candid()
        .map_err(|e| format!("Failed to decode decimals: {e}"))?;

    mutate_state(|s| {
        s.data.ledger_indexer.ledger_fee = fee;
        s.data.ledger_indexer.ledger_decimals = decimals;
        s.data.ledger_indexer.target_ledger = args.target_ledger;
        s.data.ledger_indexer.target_ledger_locked = true;
        s.data.ledger_indexer.block_cache_config.hours_nano =
            (args.hourly_size as u64) * HOUR_AS_NANOS;
        s.data.ledger_indexer.block_cache_config.days_nano =
            (args.daily_size as u64) * DAY_AS_NANOS;
    });

    info!("Target canister, fee and decimals set");
    Ok("Target canister, fee and decimals set".into())
}

/// Download new transactions from the ICRC2 ledger.
pub async fn t2_download_transactions() -> Result<Vec<ProcessedTX>, String> {
    let locked = read_state(|s| s.data.ledger_indexer.target_ledger_locked);
    if !locked {
        return Err("Target Ledger is not yet set!".into());
    }

    let ledger_canister = read_state(|s| s.data.ledger_indexer.target_ledger.clone());
    let ledger_principal = candid::Principal::from_text(&ledger_canister)
        .map_err(|e| format!("Invalid ledger principal: {}", e))?;

    // Get tip of chain
    let chain_tip = get_tip_of_chain(ledger_principal).await?;
    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.ledger_tip_of_chain = chain_tip;
    });

    let next_block = read_state(|s| s.data.ledger_indexer.working_stats.next_block);
    if chain_tip <= next_block {
        return Ok(Vec::new());
    }

    mutate_state(|s| {
        s.data.ledger_indexer.working_stats.is_upto_date = false;
    });

    download_manager(chain_tip, next_block, ledger_principal).await
}

async fn get_tip_of_chain(ledger: candid::Principal) -> Result<u64, String> {
    let req = GetBlocksArgs1 {
        start: Nat::from(0u64),
        length: Nat::from(1u64),
    };
    let resp: GetTransactionsResponse = Call::bounded_wait(ledger, "get_transactions")
        .with_arg(&req)
        .await
        .map_err(|e| format!("Tip of chain error: {e}"))?
        .candid()
        .map_err(|e| format!("Tip of chain decode error: {e}"))?;
    nat_to_u64(resp.log_length)
}

async fn download_manager(
    tip: u64,
    next_block: u64,
    ledger: candid::Principal,
) -> Result<Vec<ProcessedTX>, String> {
    let tip_plus_one = tip.saturating_add(1);
    let blocks_needed = tip_plus_one.saturating_sub(next_block);
    let chunks_needed =
        ((blocks_needed as f64) / (MAX_TRANSACTION_BATCH_SIZE as f64)).ceil() as u32;
    let max_loops =
        ((MAX_TOTAL_DOWNLOAD as f64) / (MAX_TRANSACTION_BATCH_SIZE as f64)).ceil() as u32;
    let chunks = chunks_needed.min(max_loops);

    info!(
        "ICRC2 download: blocks_needed={}, chunks={}, tip={}, next={}",
        blocks_needed, chunks, tip, next_block
    );

    let mut temp_tx_array: Vec<ProcessedTX> = Vec::new();
    let mut completed: u64 = 0;

    for i in 0..chunks {
        let start = if i == 0 { next_block } else { next_block + completed };
        let remaining = tip - start;
        let length = remaining.min(MAX_TRANSACTION_BATCH_SIZE as u64);

        let txns = icrc2_download_chunk(start, length, ledger).await?;
        let count = txns.len() as u64;
        temp_tx_array.extend(txns);
        completed += count;
    }

    Ok(temp_tx_array)
}

async fn icrc2_download_chunk(
    start: u64,
    length: u64,
    ledger: candid::Principal,
) -> Result<Vec<ProcessedTX>, String> {
    let req = GetBlocksArgs1 {
        start: Nat::from(start),
        length: Nat::from(length),
    };
    let resp: GetTransactionsResponse = Call::bounded_wait(ledger, "get_transactions")
        .with_arg(&req)
        .await
        .map_err(|e| format!("get_transactions error: {e}"))?
        .candid()
        .map_err(|e| format!("get_transactions decode error: {e}"))?;

    let has_ledger = !resp.transactions.is_empty();
    let has_archive = !resp.archived_transactions.is_empty();

    match (has_ledger, has_archive) {
        (true, true) => {
            let mut all_txs = fetch_all_archives(&resp.archived_transactions).await?;
            let next = all_txs.last().map(|tx| tx.block + 1).unwrap_or(start);
            let mut ledger_txs = process_ledger_blocks(resp.transactions, next)?;
            all_txs.append(&mut ledger_txs);
            Ok(all_txs)
        }
        (true, false) => process_ledger_blocks(resp.transactions, start),
        (false, true) => fetch_all_archives(&resp.archived_transactions).await,
        (false, false) => Ok(Vec::new()),
    }
}

async fn fetch_all_archives(
    archives: &[ArchivedRange1],
) -> Result<Vec<ProcessedTX>, String> {
    let mut all_txs = Vec::new();
    for archived in archives {
        let txs = get_transactions_from_archive(archived).await?;
        all_txs.extend(txs);
    }
    Ok(all_txs)
}

async fn get_transactions_from_archive(
    archived: &ArchivedRange1,
) -> Result<Vec<ProcessedTX>, String> {
    let req = GetBlocksArgs1 {
        start: archived.start.clone(),
        length: archived.length.clone(),
    };
    let mut master_block = nat_to_u64(archived.start.clone())?;
    let ledger_id = archived.callback.0.principal;
    let method = &archived.callback.0.method;

    let range: TransactionRange = Call::bounded_wait(ledger_id, method.as_str())
        .with_arg(&req)
        .await
        .map_err(|e| format!("Archive fetch error: {e}"))?
        .candid()
        .map_err(|e| format!("Archive decode error: {e}"))?;

    let mut txs = Vec::new();
    for tx in range.transactions {
        process_single_transaction(&tx, &mut master_block, &mut txs)?;
    }
    Ok(txs)
}

fn process_ledger_blocks(
    transactions: Vec<IcrcTransaction>,
    mut master_block: u64,
) -> Result<Vec<ProcessedTX>, String> {
    let mut processed = Vec::new();
    for tx in &transactions {
        process_single_transaction(tx, &mut master_block, &mut processed)?;
    }
    Ok(processed)
}

fn process_single_transaction(
    tx: &IcrcTransaction,
    master_block: &mut u64,
    output: &mut Vec<ProcessedTX>,
) -> Result<(), String> {
    if let Some(ref mint) = tx.mint {
        let to_ac = icrc_account_to_string(mint.to.clone());
        let val = nat_to_u128(mint.amount.clone())?;
        output.push(ProcessedTX {
            block: *master_block,
            tx_type: TransactionType::Mint.to_string(),
            from_account: "Token Ledger".into(),
            to_account: to_ac,
            tx_value: val,
            tx_fee: None,
            tx_time: tx.timestamp,
            spender: None,
        });
        *master_block += 1;
    }

    if let Some(ref burn) = tx.burn {
        let fm_ac = icrc_account_to_string(burn.from.clone());
        let spend = burn.spender.as_ref().map(|s| icrc_account_to_string(s.clone()));
        let val = nat_to_u128(burn.amount.clone())?;
        output.push(ProcessedTX {
            block: *master_block,
            tx_type: TransactionType::Burn.to_string(),
            from_account: fm_ac,
            to_account: "Token Ledger".into(),
            tx_value: val,
            tx_fee: None,
            tx_time: tx.timestamp,
            spender: spend,
        });
        *master_block += 1;
    }

    if let Some(ref transfer) = tx.transfer {
        let to_ac = icrc_account_to_string(transfer.to.clone());
        let fm_ac = icrc_account_to_string(transfer.from.clone());
        let spend = transfer.spender.as_ref().map(|s| icrc_account_to_string(s.clone()));
        let fee = transfer.fee.as_ref().map(|f| nat_to_u128(f.clone())).transpose()?;
        let val = nat_to_u128(transfer.amount.clone())?;
        output.push(ProcessedTX {
            block: *master_block,
            tx_type: TransactionType::Transfer.to_string(),
            from_account: fm_ac,
            to_account: to_ac,
            tx_value: val,
            tx_fee: fee,
            tx_time: tx.timestamp,
            spender: spend,
        });
        *master_block += 1;
    }

    if let Some(ref approve) = tx.approve {
        let fm_ac = icrc_account_to_string(approve.from.clone());
        let spend = icrc_account_to_string(approve.spender.clone());
        let fee = approve.fee.as_ref().map(|f| nat_to_u128(f.clone())).transpose()?;
        let val = nat_to_u128(approve.amount.clone()).unwrap_or(u128::MAX);
        output.push(ProcessedTX {
            block: *master_block,
            tx_type: TransactionType::Approve.to_string(),
            from_account: fm_ac,
            to_account: spend.clone(),
            tx_value: val,
            tx_fee: fee,
            tx_time: tx.timestamp,
            spender: Some(spend),
        });
        *master_block += 1;
    }

    Ok(())
}
