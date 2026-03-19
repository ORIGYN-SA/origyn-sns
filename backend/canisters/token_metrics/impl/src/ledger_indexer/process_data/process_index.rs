use token_metrics_api::types::ledger_indexer::{SmallTX, TransactionType};
use crate::ledger_indexer::account_tree::{
    process_approve_from, process_transfer_from, process_transfer_to,
};

/// Process SmallTX vec into the account-level index.
pub fn process_smtx_to_index(blocks: &[SmallTX]) -> Result<u64, String> {
    let mut latest_block = 0u64;

    for tx in blocks {
        // Process FROM side
        if let Some(ref from_acct) = tx.from {
            match tx.tx_type {
                TransactionType::Transfer => {
                    process_transfer_from(from_acct, tx)?;
                }
                TransactionType::Mint => {} // Mint — from TOKEN LEDGER, nothing to do
                TransactionType::Burn => {
                    // Burn — debit the sender
                    process_transfer_from(from_acct, tx)?;
                }
                TransactionType::Approve => {
                    // Approve — debit fee only
                    process_approve_from(from_acct, tx)?;
                }
            }
        }

        // Process TO side
        if let Some(ref to_acct) = tx.to {
            match tx.tx_type {
                TransactionType::Transfer => {
                    process_transfer_to(to_acct, tx)?;
                }
                TransactionType::Mint => {
                    process_transfer_to(to_acct, tx)?;
                }
                TransactionType::Burn => {} // Burn — to TOKEN LEDGER, nothing to do
                TransactionType::Approve => {} // Approve — spender account, no tokens moved
            }
        }

        if tx.block > latest_block {
            latest_block = tx.block;
        }
    }

    Ok(latest_block)
}
