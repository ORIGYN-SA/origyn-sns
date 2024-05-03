use ic_cdk_macros::{update, query};

use crate::core::{runtime::RUNTIME_STATE, stable_memory::STABLE_STATE, working_stats::api_count};

use super::{
    fetch_data::{
        dfinity_icp::{SetTargetArgs, t1_impl_set_target_canister}, dfinity_icrc2::t2_impl_set_target_canister, meme_icrc::t3_impl_set_target_canister, tx_store::{get_single_tx_from_store, get_multiple_txs_from_store, get_multiple_txs_from_store_time}
    }, 
    custom_types::{IndexerType, ProcessedTX, FullDataResponse, FullDataResponseRaw, LinkDataResponse, TimeSearchArgs}, utils::remove_none_ptx_values, constants::MAX_BLOCKS_TO_RETURN, account_tree::{Overview, LinkData}
};

// [][] -- ADMIN GATED -- [][]
#[update]
pub async fn init_target_ledger(args: SetTargetArgs, index_type: IndexerType) -> String {
    // check admin
    RUNTIME_STATE.with(|s|{s.borrow().data.check_admin(ic_cdk::caller().to_text())});
    // select route
    match index_type {
        IndexerType::DfinityIcp => {
            let res = t1_impl_set_target_canister(args).await;
            match res {
                Ok(v) => {
                    RUNTIME_STATE.with(|s|{s.borrow_mut().data.set_index_type(index_type)}); 
                    return v;
                },
                Err(e) => { return e}
            }
        },
        IndexerType::DfinityIcrc2 => {
            let res = t2_impl_set_target_canister(args).await;
            match res {
                Ok(v) => { 
                    RUNTIME_STATE.with(|s|{s.borrow_mut().data.set_index_type(index_type)}); 
                    return v;
                },
                Err(e) => { return e}
            }
        },
        IndexerType::MemeIcrc => {
            let res = t3_impl_set_target_canister(args).await;
            match res {
                Ok(v) => { 
                    RUNTIME_STATE.with(|s|{s.borrow_mut().data.set_index_type(index_type)}); 
                    return v;
                },
                Err(e) => { return e}
            }
        }
    }
}

// [][] -- AUTHORISED GATED -- [][]
// get latest blocks (from this canister's cache not tx store. Max 20K)
#[query]
fn get_latest_transactions(number_txs: u32) -> Vec<ProcessedTX> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    RUNTIME_STATE.with(|s|{
        s.borrow().data.latest_blocks.get_txs(number_txs as usize)
    })
}

// get single tx from store
#[update] //#[query(composite = true)]
async fn get_tx(block: u64) -> Option<ProcessedTX> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    match get_single_tx_from_store(block).await {
        Ok(v) => {
            return v;
        },
        Err(e) => {
            ic_cdk::trap(e.as_str());
        }
    }
}

// get multiple tx from store
#[update]//#[query(composite = true)]
async fn get_multiple_tx(block_vec: Vec<u64>) -> Vec<ProcessedTX> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    // fetch from tx store
    let res: Result<Vec<Option<ProcessedTX>>, String> = get_multiple_txs_from_store(block_vec).await;
    match res {
        Ok(v) => {
            let ret: Vec<ProcessedTX> = remove_none_ptx_values(v);
            return ret;
        },
        Err(e) => {
            ic_cdk::trap(e.as_str());
        }
    }
}

// get full account info by u64 ref
#[update]//#[query(composite = true)]
async fn get_full_from_ref(id_ref: u64) -> Option<FullDataResponse> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    // get blocks 
    let block_refs = STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_transactions_by_ref(&id_ref)
    });
    match block_refs {
        Some(mut vec_refs) => {
            // trim blocks to 
            vec_refs.reverse();
            vec_refs.truncate(MAX_BLOCKS_TO_RETURN);
            // fetch blocks
            let ptx: Result<Vec<Option<ProcessedTX>>, String> = get_multiple_txs_from_store(vec_refs).await;
            match ptx {
                Ok(ptx_res) => {
                    let ptx2 = remove_none_ptx_values(ptx_res);
                     // get rest of data
                    let overview_and_links: Option<FullDataResponse> = STABLE_STATE.with(|s|{
                        s.borrow().as_ref().unwrap().get_fulldata_by_ref(&id_ref)
                    });
                    match overview_and_links {
                        Some(ovlnk) => {
                            let mut ret: FullDataResponse = ovlnk;
                            ret.blocks = ptx2; 
                            return Some(ret);
                        },
                        None => {
                             return None
                        } 
                    }
                },
                Err(_e) => { return None } 
            }
        },
        None => { return None } 
    }
}

// full response from u64 Ref in unprocessed format. Note blocks aren't reversed. 
#[query]//#[query(composite = true)]
fn get_full_from_ref_raw(id_ref: u64) -> Option<FullDataResponseRaw> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_fulldata_by_ref_raw(&id_ref)
    })
}

// get full account info by ID (account string)
#[update]//#[query(composite = true)]
async fn get_full_from_id(id_string: String) -> Option<FullDataResponse> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    // get blocks 
    let block_refs = STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_transactions_by_id(&id_string)
    });
    match block_refs {
        Some(mut vec_refs) => {
            // trim blocks to 
            vec_refs.reverse();
            vec_refs.truncate(MAX_BLOCKS_TO_RETURN);
            // fetch blocks
            let ptx: Result<Vec<Option<ProcessedTX>>, String> = get_multiple_txs_from_store(vec_refs).await;
            match ptx {
                Ok(ptx_res) => {
                    let ptx2 = remove_none_ptx_values(ptx_res);
                    // get rest of data
                    let overview_and_links: Option<FullDataResponse> = STABLE_STATE.with(|s|{
                        s.borrow().as_ref().unwrap().get_fulldata_by_id(&id_string)
                    });
                    match overview_and_links {
                        Some(ovlnk) => {
                            let mut ret: FullDataResponse = ovlnk;
                            ret.blocks = ptx2; 
                            return Some(ret);
                        },
                        None => { return None } 
                    }
                },
                Err(_e) => { return None } 
            }
        },
        None => {return None}
    }
}

// full response from ID String in unprocessed format. Note blocks aren't reversed.  
#[query]//#[query(composite = true)]
async fn get_full_from_id_raw(id_string: String) -> Option<FullDataResponseRaw> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_fulldata_by_id_raw(&id_string)
    })
}

// Overview by ID string
#[query]
fn get_overview_by_id(id_string: String) -> Option<Overview> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_overview_by_id(&id_string)        
    })
}

// Overview by u64 ref
#[query]
fn get_overview_by_ref(id_ref: u64) -> Option<Overview> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_overview_by_ref(&id_ref)        
    })
}

// Account Links by ID
#[query]
fn get_links_from_id(id_string: String) -> Option<Vec<LinkDataResponse>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let overview_and_links: Option<FullDataResponse> = STABLE_STATE.with(|s|{
                s.borrow().as_ref().unwrap().get_fulldata_by_id(&id_string)
    });
    match overview_and_links {
        Some(v) => {
            return Some(v.links);
        },
        None => { return None}
    }
}

// Account Links by Ref
#[query]
fn get_links_from_ref(id_ref: u64) -> Option<Vec<LinkDataResponse>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let overview_and_links: Option<FullDataResponse> = STABLE_STATE.with(|s|{
                s.borrow().as_ref().unwrap().get_fulldata_by_ref(&id_ref)
    });
    match overview_and_links {
        Some(v) => {
            return Some(v.links);
        },
        None => { return None}
    }
}

// Account Links by ID (RAW)
#[query]
fn get_links_from_id_raw(id_string: String) -> Option<Vec<LinkData>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let overview_and_links: Option<FullDataResponseRaw> = STABLE_STATE.with(|s|{
                s.borrow().as_ref().unwrap().get_fulldata_by_id_raw(&id_string)
    });
    match overview_and_links {
        Some(v) => {
            return Some(v.links);
        },
        None => { return None}
    }
}

// Account Links by Ref (RAW)
#[query]
fn get_links_from_ref_raw(id_ref: u64) -> Option<Vec<LinkData>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let overview_and_links: Option<FullDataResponseRaw> = STABLE_STATE.with(|s|{
                s.borrow().as_ref().unwrap().get_fulldata_by_ref_raw(&id_ref)
    });
    match overview_and_links {
        Some(v) => {
            return Some(v.links);
        },
        None => { return None}
    }
}

// Account transactions by ID (Max Return value = MAX_BLOCKS_TO_RETURN)
#[update]
async fn get_transactions_from_id(id_string: String) -> Option<Vec<ProcessedTX>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let block_refs: Option<Vec<u64>> = STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_transactions_by_id(&id_string)
    });
    match block_refs {
        Some(mut vec_refs) => {
            // trim blocks to 
            vec_refs.truncate(MAX_BLOCKS_TO_RETURN);
            // fetch blocks
            let ptx: Result<Vec<Option<ProcessedTX>>, String> = get_multiple_txs_from_store(vec_refs).await;
            match ptx {
                Ok(ptx_res) => {
                    let ptx2: Vec<ProcessedTX> = remove_none_ptx_values(ptx_res);
                    return Some(ptx2);
                },
                Err(_e) => { return None }
            }
        },
        None => {return None}
    }
}


// Account transactions by ID (filtered by time) (Max Return value = MAX_BLOCKS_TO_RETURN)
#[update]
async fn get_transactions_time_id(args: TimeSearchArgs) -> Option<Vec<ProcessedTX>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let block_refs: Option<Vec<u64>> = STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_transactions_by_id(&args.id)
    });
    match block_refs {
        Some(vec_refs) => {
            // fetch blocks
            let ptx: Result<Option<Vec<ProcessedTX>>, String> = get_multiple_txs_from_store_time(vec_refs, args.start, args.end, MAX_BLOCKS_TO_RETURN as u64).await;
            match ptx {
                Ok(ptx_res) => {
                    return ptx_res;
                },
                Err(_e) => { return None }
            }
        },
        None => {return None}
    }
}

// Account transactions ID (raw)
#[query]
fn get_transactions_from_id_raw(id_string: String) -> Option<Vec<u64>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let txs: Option<Vec<u64>> = STABLE_STATE.with(|s|{
                s.borrow().as_ref().unwrap().get_transactions_by_id(&id_string)
    });
    match txs {
        Some(v) => {
            return Some(v);
        },
        None => { return None}
    }
}

// Account transactions by Ref (Max Return value - MAX_BLOCKS_TO_RETURN)
#[update]
async fn get_transactions_from_ref(id_ref: u64) -> Option<Vec<ProcessedTX>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let block_refs: Option<Vec<u64>> = STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().get_transactions_by_ref(&id_ref)
    });
    match block_refs {
        Some(mut vec_refs) => {
            // trim blocks to 
            vec_refs.truncate(MAX_BLOCKS_TO_RETURN);
            // fetch blocks
            let ptx = get_multiple_txs_from_store(vec_refs).await;
            match ptx {
                Ok(ptx_res) => {
                    let ptx2: Vec<ProcessedTX> = remove_none_ptx_values(ptx_res);
                    return Some(ptx2);
                },
                Err(_e) => { return None }
            }
        },
        None => {return None}
    }
}

// Account transactions by Ref (raw)
#[query]
fn get_transactions_from_ref_raw(id_ref: u64) -> Option<Vec<u64>> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    let txs: Option<Vec<u64>> = STABLE_STATE.with(|s|{
                s.borrow().as_ref().unwrap().get_transactions_by_ref(&id_ref)
    });
    match txs {
        Some(v) => {
            return Some(v);
        },
        None => { return None}
    }
}

// ID to Ref 
#[query]
fn get_id_from_ref(id_ref: u64) -> Option<String> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    // get ID
    let id = STABLE_STATE.with(|state| {
        state.borrow().as_ref().unwrap().directory_data.get_id(&id_ref)  
    });
    match id {
        Some(v) => { return Some(v)},
        None => {return None},
    }
}

// Ref to ID
#[query]
fn get_ref_from_id(id_string: String) -> Option<u64> {
    // check authorised
    RUNTIME_STATE.with(|s|{s.borrow().data.check_authorised(ic_cdk::caller().to_text())});
    api_count(); // count requests
    // get ID
    let id = STABLE_STATE.with(|state| {
        state.borrow().as_ref().unwrap().directory_data.get_ref(&id_string)  
    });
    match id {
        Some(v) => { return Some(v)},
        None => {return None},
    }
}