use crate::{core::{runtime::RUNTIME_STATE, utils::canister_call}, indexer::{custom_types::{GetTxFromStoreArgs, SmallTX, ProcessedTX, GetMultipleTxFromStoreArgs, GetMultipleTxFromStoreTimeArgs}, process_data::small_tx::smalltx_to_processedtx}};


// for fetching data from tx_store
pub async fn get_single_tx_from_store(block: u64) -> Result<Option<ProcessedTX>, String> {
    let store_id = RUNTIME_STATE.with(|s|{
        s.borrow().data.get_tx_store()
    });

    let args = GetTxFromStoreArgs(block);
    let res:  Result<(Option<SmallTX>,), (ic_cdk::api::call::RejectionCode, String)> = canister_call(
        &store_id.as_str(),
        "get_tx_from_store",
        args
    ).await;
    match res {
       Ok(v) =>  { 
            match v.0 {
                Some(stx) => {
                    let temp_vec: Vec<SmallTX> = vec![stx];
                    let processed_tx = smalltx_to_processedtx(&temp_vec);
                    return Ok(Some(processed_tx[0].clone()));
                },
                None => { return Ok(None) }
            }
       },
       Err(e) => {
        let error = format!("Could not get TX from Store - {:?}, {}", e.0, e.1);
        return Err(error);
       }
    }
}

pub async fn get_multiple_txs_from_store(blocks: Vec<u64>) -> Result< Vec< Option<ProcessedTX> >, String> {
    let store_id = RUNTIME_STATE.with(|s|{
        s.borrow().data.get_tx_store()
    });

    let args = GetMultipleTxFromStoreArgs(blocks);
    let res:  Result<(Vec<Option<SmallTX>>,), (ic_cdk::api::call::RejectionCode, String)> = canister_call(
        &store_id.as_str(),
        "get_multiple_tx_from_store",
        args
    ).await;
    match res {
       Ok(v) =>  {
            let mut op_vec:Vec<Option<ProcessedTX>> = Vec::new();
            for tx in v.0 {
                match tx {
                    Some(stx) => {
                        let temp_vec: Vec<SmallTX> = vec![stx];
                        let processed_tx = smalltx_to_processedtx(&temp_vec);
                        op_vec.push(Some(processed_tx[0].clone()));
                    },
                    None => { op_vec.push(None) }
                }
            }
            return Ok(op_vec);
       },
       Err(e) => {
        let error = format!("Could not get TX from Store - {:?}, {}", e.0, e.1);
        return Err(error);
       }
    }
}


pub async fn get_multiple_txs_from_store_time(blocks: Vec<u64>, start: u64, end: u64, max_return: u64) 
-> Result< Option<Vec<ProcessedTX>>, String> {
    let store_id = RUNTIME_STATE.with(|s|{
        s.borrow().data.get_tx_store()
    });

    let args = GetMultipleTxFromStoreTimeArgs{
        blocks,
        start,
        end,
        max_return,
    };
    let res:  Result<(Option<Vec<SmallTX>>,), (ic_cdk::api::call::RejectionCode, String)> = canister_call(
        &store_id.as_str(),
        "get_multiple_tx_from_store_time",
        args
    ).await;
    match res {
        Ok(v) => {
            match v.0 {
                Some(stx_v) => {
                    let processed_tx = smalltx_to_processedtx(&stx_v);
                    return Ok(Some(processed_tx));
                },
                None => {
                    return Ok(None);
                }
            }
        }
        Err(e) => {
            let error = format!("Error fetching multiple_tx_from_store_time - {:?}. {}", e.0, e.1);
            return Err(error);
        }
    }
}
