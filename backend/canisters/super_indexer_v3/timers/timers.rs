use std::{time::Duration, borrow::Borrow};
use crate::{
    core::{utils::{critical_err, canister_call, log}, runtime::RUNTIME_STATE, working_stats::count_error}, 
    indexer::{custom_types::{IndexerType, ProcessedTX}, 
    fetch_data::{dfinity_icp::t1_download_transactions, dfinity_icrc2::t2_download_transactions, meme_icrc::t3_download_transactions}, 
    process_data::{small_tx::{processedtx_to_smalltx, send_smalltx_to_store}, process_index::process_smtx_to_index}
    }
};
use super::state::TIMER_STATE;


pub fn start_processing_time_impl(secs: u64) {
    let secs = Duration::from_secs(secs);
    let timer_id = ic_cdk_timers::set_timer_interval(secs, ||
        ic_cdk::spawn(schedule_data_processing())
    );
    TIMER_STATE.with(|timer_ids| timer_ids.borrow_mut().push(timer_id));
}

// Fetch Main quotes
pub async fn schedule_data_processing(){
    // check is busy - early exit
    let is_busy = RUNTIME_STATE.with(|s|{
        s.borrow().stats.is_busy
    });
    if is_busy == true {
        return;
    } else {
        // set busy
        RUNTIME_STATE.with(|s|{
            s.borrow_mut().stats.set_busy()
        });
    }

    // FETCH LATEST TRANSACTIONS
    let index_type = RUNTIME_STATE.with(|s|{
        s.borrow().data.get_index_type()
    });
    let latest_transactions:  Result<Vec<ProcessedTX>, String>;
    match index_type {
        // ICP LEDGER
        IndexerType::DfinityIcp => {
            // Download txs from ICP Type Ledger
            latest_transactions = t1_download_transactions().await;
        },
        IndexerType::DfinityIcrc2 => {
            // Download txs from Dfinity ICRC 2 type ledger
            latest_transactions = t2_download_transactions().await;
        },
        IndexerType::MemeIcrc => {
            // Download txs from Dfinity ICRC 2 type ledger
            latest_transactions = t3_download_transactions().await;
        },
    }

    // PROCESS LATEST TRANSACTIONS
    match latest_transactions {
        Ok(txs) => {
            // catch 0 len (nothing to download) events. Return early
            if txs.len() == 0 {
                // 
                let time = ic_cdk::api::time();
                RUNTIME_STATE.with(|s|{
                    s.borrow_mut().stats.last_update_time = time;
                });

                // set to being not busy
                RUNTIME_STATE.with(|s|{
                    s.borrow_mut().stats.set_not_busy()
                });
                return;
            }

            // process ptx to stx
            let latest_as_smalltx = processedtx_to_smalltx(&txs);
            // store stx
            RUNTIME_STATE.with(|s|{
                s.borrow_mut().data.temp_small_tx = latest_as_smalltx.clone();
            });
            // store ptx 
            RUNTIME_STATE.with(|s|{
                s.borrow_mut().data.temp_processed_tx = txs;
            });

            // self call (process index)
            let self_id = RUNTIME_STATE.with(|s|{
                s.borrow().data.get_self_id()
            });
            let sc1: Result<(Result<u64, String>,), (ic_cdk::api::call::RejectionCode, String)> 
            = canister_call(self_id.as_str(), "self_call", ()).await;

            // update latest blocks/ tx_store/ stats/ clear temp vecs
            match sc1 {
                // call returned ok
                Ok(call_result) => {
                    // match call data returned
                    match call_result.0 {
                        Ok(processed_tip) => {

                            // send to tx_store
                            let send_length = &latest_as_smalltx.len();
                            let stx_send = send_smalltx_to_store(latest_as_smalltx.clone()).await;
                            match stx_send {
                                Ok(v) => { 
                                    // check all sent were added
                                    if v as usize != send_length.to_owned() { // NOT OK!
                                        let error = String::from("Error store stx length != sent stx length");
                                        critical_err(error).await;
                                    } else { // IS OK
                                        // update latest blocks (for get_latest_blocks)
                                        RUNTIME_STATE.with(|s|{
                                            s.borrow_mut().data.process_temp_ptx_to_latest_blocks()
                                        });
                                        
                                        // tip of ledger chain
                                        let tip = RUNTIME_STATE.with(|s|{
                                            s.borrow().stats.ledger_tip_of_chain
                                        });

                                        // is up to date?
                                        let last_available_block = tip.saturating_sub(1);  // to account for 0 block
                                        if &processed_tip == &last_available_block {             
                                            RUNTIME_STATE.with(|s|{
                                                s.borrow_mut().stats.set_is_upto_date(true);
                                            });
                                        }
                                        let next = processed_tip.saturating_add(1);
                                        // update last processed metric
                                        RUNTIME_STATE.with(|s|{
                                            s.borrow_mut().stats.set_next_block(next.clone())
                                        });

                                        // clear temp vecs
                                        RUNTIME_STATE.with(|s|{
                                            s.borrow_mut().data.temp_small_tx = Vec::new();
                                            s.borrow_mut().data.temp_processed_tx = Vec::new();
                                        });

                                        // last update time 
                                        let time = ic_cdk::api::time();
                                        RUNTIME_STATE.with(|s|{
                                            s.borrow_mut().stats.last_update_time = time;
                                        });
                                        log(format!("Processing Complete : Indexer done upto and including : {}", processed_tip));
                                    }
                                },
                                Err(e) => {
                                    let error = format!("Error could not update stx store: {}", e);
                                    count_error();
                                    critical_err(error).await;
                                }
                            }
                        },
                        Err (er) => {
                            // call data is an error 
                            let error = format!("Process Index (self call) returned error : {}", er);
                            count_error();
                            critical_err(error).await;
                        }
                    }// end match call data result
                },
                Err(e) => {
                    // call failed 
                    let error = format!("(self call) failed : {:?}, {}", e.0, e.1);
                    count_error();
                    critical_err(error).await;
                }
            } // end match self call
        },
        Err(e) => {
            let error = format!("Error downloading transactions from ledger: {}", e);
            count_error();
            critical_err(error).await;
        }
    }

    // set to being not busy
    RUNTIME_STATE.with(|s|{
        s.borrow_mut().stats.set_not_busy()
    });
}

 // process stx to account index
pub async fn process_index_self_call() -> Result<u64, String> {
    let latest_as_smalltx = RUNTIME_STATE.with(|s|{
        s.borrow().data.temp_small_tx.clone()
    });

    let index_res = process_smtx_to_index(latest_as_smalltx);
    match index_res {
        Ok(processed_tip) => {
            return Ok(processed_tip);
        },
        Err(e) => {
            let error = format!("Error processing stx to index: {}", e);
            return Err(error);
        },
    }
}