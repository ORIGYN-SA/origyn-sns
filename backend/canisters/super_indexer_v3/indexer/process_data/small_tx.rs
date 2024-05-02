use candid::{Nat, error};
use crate::{
    core::{
        runtime::RUNTIME_STATE,
        utils::{canister_call, log}, stable_memory::STABLE_STATE
    }, 
    indexer::{custom_types::{ProcessedTX, SmallTX, SendTxToStoreArgs}, directory::add_to_directory}
};

pub fn processedtx_to_smalltx(input_vec: &Vec<ProcessedTX>) -> Vec<SmallTX> {
    let mut stx:Vec<SmallTX> = Vec::new();
    for tx in input_vec {
        // get refs for from/ to accounts
        let fm: Option<u64>;
        let fm_ac = tx.from_account.as_str();
        if  fm_ac != "Token Ledger" 
        {
            fm = add_to_directory(&tx.from_account);
        } else { fm = None };

        let to: Option<u64>;
        let to_ac = tx.to_account.as_str();
        if  to_ac != "Token Ledger" 
        {
            to = add_to_directory(&tx.to_account);
        } else { to = None };

        let fee: Option<u128>;
        if let Some(fee_value) = tx.tx_fee.clone() { fee = Some(fee_value) } else { fee = None }

        let tx_type: u8;
        match tx.tx_type.as_str() {
            "Transfer" => {tx_type = 0},
            "Mint" => {tx_type = 1},
            "Burn" => {tx_type = 2},
            "Approve" => {tx_type = 3},
            _ => {tx_type = 99},
        }

        stx.push(SmallTX{
                    block: tx.block as u64,
                    time: tx.tx_time,
                    from: fm, 
                    to: to,
                    tx_type,
                    value: tx.tx_value.clone(),
                    fee  
                });
    } // for
    return stx;
}

// should only be called if processedtx to small tx has been called as this creates the directory to 
// convert u64 back to strings. 
pub fn smalltx_to_processedtx(input_vec: &Vec<SmallTX>) -> Vec<ProcessedTX> {
    let mut ptx:Vec<ProcessedTX> = Vec::new();

    for tx in input_vec {
        // get refs for from/ to accounts
        let fm_to: (String, String) = STABLE_STATE.with(|s| {
            let fm: String;
            let to: String;

            if let Some(fm_value) = tx.from {
                fm = s.borrow_mut().as_mut().unwrap().directory_data.get_id(&fm_value).unwrap();
             } else { fm = String::from("Token Ledger") }

             if let Some(to_value) = tx.to {
                to = s.borrow_mut().as_mut().unwrap().directory_data.get_id(&to_value).unwrap();
             } else { to = String::from("Token Ledger") }
 
            return (fm, to);
        });

        let mut tx_type: String = String::new();
        match tx.tx_type {
            0 => {tx_type = "Transfer".to_string()},
            1 => {tx_type = "Mint".to_string()},
            2 => {tx_type = "Burn".to_string()},
            3 => {tx_type = "Approve".to_string()},
            _ => {}
        }
        
        ptx.push(ProcessedTX { 
            block: tx.block, 
            hash: "No-hash".to_string(), 
            tx_type, 
            from_account: fm_to.0, 
            to_account: fm_to.1, 
            tx_value: tx.value.clone(), 
            tx_time: tx.time, 
            tx_fee: tx.fee.clone(),
            spender: None
        });
    } // for
    return ptx;
}

pub async fn send_smalltx_to_store(data: Vec<SmallTX>) -> Result<u64, String> {
    let store_id = RUNTIME_STATE.with(|s|{
        s.borrow().data.get_tx_store()
    });
    let args2 = SendTxToStoreArgs(data);
    let res:  Result<(u64,), (ic_cdk::api::call::RejectionCode, String)> = canister_call(
        &store_id.as_str(),
        "add_txs_to_store",
        args2
    ).await;
    match res {
       Ok(v) =>  { return Ok(v.0); },
       Err(e) => {
        let error = format!("Couldn't send tx to store - {:?}. {}", e.0, e.1);
        return Err(error);
       }
    }
}

pub async fn init_tx_store(store_canister: String) -> bool {
    let res:  Result<(bool,), (ic_cdk::api::call::RejectionCode, String)> = canister_call(
        &store_canister.as_str(),
        "canister_init",
        ()
    ).await;
    match res {
       Ok(v) =>  { return v.0; },
       Err(e) => {
        log(format!("Couldn't Init TX Store {:?}. {}", e.0, e.1));
        return false;
       }
    }
}