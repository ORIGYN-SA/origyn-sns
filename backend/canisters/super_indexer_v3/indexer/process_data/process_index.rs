use crate::{core::{utils::log, runtime::RUNTIME_STATE, stable_memory::STABLE_STATE}, indexer::custom_types::SmallTX};

pub fn process_smtx_to_index(blocks: Vec<SmallTX>) -> Result<u64, String> {
    let mut latest_block = 0_u64;
    for tx in blocks {
        // process from account side of TX ⬅️💰
        if let Some(from_ref) = tx.from {
            // Process TX
            match tx.tx_type {
                // transfer from
                0  => {
                    // process overview
                    let ov = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                        .account_data.process_transfer_from(&from_ref, &tx)});
                    match ov {
                        Err(e) => { return Err(e) },
                        _ => {}
                    }
                        
                    // process links
                    let linked_ref = tx.to.unwrap(); // safe as this should not be None in transfer type. 
                    let pl = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                    .account_data.process_links(&from_ref, &linked_ref, -1_i8, &tx)});
                    match pl {
                        Err(e) => { return Err(e) },
                        _ => {}
                    }

                    // process blocks
                    let pb = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                        .account_data.process_block(&from_ref, tx.block)});
                    match pb {
                        Err(e) => { return Err(e) },
                        _ => {}
                    }
                }, 
                // Mint
                1  => {}, // do nothing - this tx is from TOKEN LEDGER
                // Burn
                2  => {
                    // process overview
                    let po = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                        .account_data.process_transfer_from(&from_ref, &tx)});
                    match po {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }
                    // process blocks
                    let pb = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                        .account_data.process_block(&from_ref, tx.block)});
                    match pb {
                        Err(e) => { return Err(e) },
                        _ => {}
                    }
                    // Note - No links to process as linked account is ICP LEDGER
                },
                // Approve 
                3  => {
                    // process overview
                    let po = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                        .account_data.process_approve_from(&from_ref, &tx)});
                    match po {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }
                    // process blocks
                    let pb = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                        .account_data.process_block(&from_ref, tx.block)});
                    match pb {
                        Err(e) => { return Err(e) },
                        _ => {}
                    }
                    // Note - No links to process as linked account is SPENDER Account
                }, 
                _ =>  {
                    log(format!("Error - unknown tx type (process_smtx_to_index). Type: {}", tx.tx_type));
                    let error = format!("Error 1 - unknown tx type (process_smtx_to_index). Type: {}", tx.tx_type);
                    return Err(error);
                },
            }
        }
        
        // process to account side of TX ➡️💰
        if let Some(to_ref) = tx.to {
            match tx.tx_type {
                // Transfer to
                0  => {
                    // process overview
                    let po = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                    .account_data.process_transfer_to(&to_ref, &tx)});
                    match po {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }    
    
                    // process links
                    let linked_ref = tx.from.unwrap(); // safe as this should not be None in transaction type. 
                    let pl = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                    .account_data.process_links(&to_ref, &linked_ref, 1_i8, &tx)});
                    match pl {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }

                    // process blocks
                    let pb = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                    .account_data.process_block(&to_ref, tx.block)});
                    match pb {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }
                }, 
                // Mint
                1  => {
                    // process overview
                    let po =STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                    .account_data.process_transfer_to(&to_ref, &tx)});
                    match po {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }  

                    // process blocks
                    let pb = STABLE_STATE.with(|s|{s.borrow_mut().as_mut().unwrap()
                    .account_data.process_block(&to_ref, tx.block)});
                    match pb {
                        Err(e) => { return Err(e)},
                        _ => {}
                    }
                    // Note - No links to process as linked account is TOKEN LEDGER

                }, 
                // Burn - do nothing tx is to TOKEN LEDGER
                2  => {},
                // Approve - do nothing. To a/c is the spender ac or to account. No tokens moved, no fee either.   
                3  => {},
                _ =>  {
                    log(format!("Error - unknown tx type (process_smtx_to_index). Type: {}", tx.tx_type));
                    let error = format!("Error 2 - unknown tx type (process_smtx_to_index). Type: {}", tx.tx_type);
                    return Err(error);
                },
            }
        }
        if tx.block > latest_block { latest_block = tx.block }
    }// for tx
    return Ok(latest_block);
}


