use ic_cdk_macros::{update, query};

use crate::core::{runtime::RUNTIME_STATE, stable_memory::STABLE_STATE};

use super::custom_types::{SmallTX, GetMultipleTxFromStoreTimeArgs};

#[update]
fn add_txs_to_store(tx_vec: Vec<SmallTX>) -> u64 {
    // check admin
    RUNTIME_STATE.with(|s| {
        s.borrow().data.check_admin(ic_cdk::caller().to_text())
    });
    // add txs
    let mut num_added = 0_u64;
    STABLE_STATE.with(|s|{
        for tx in tx_vec {
            s.borrow_mut().as_mut().unwrap().tx_store.add_tx(tx);
            num_added += 1_u64;
        }
    });
    return num_added;
}

#[query]
fn get_tx_from_store(block_number: u64) -> Option<SmallTX> {
    // check authorised
    RUNTIME_STATE.with(|s| {
        s.borrow().data.check_admin(ic_cdk::caller().to_text())
    });
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().tx_store.get_tx(block_number)
    })
}

#[query]
fn get_multiple_tx_from_store(block_vec: Vec<u64>) -> Vec<Option<SmallTX>> {
    // check authorised
    RUNTIME_STATE.with(|s| {
        s.borrow().data.check_admin(ic_cdk::caller().to_text())
    });
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().tx_store.get_multiple_tx(block_vec)
    })
}

#[query] // UNTESTED! 
fn get_multiple_tx_from_store_time(args: GetMultipleTxFromStoreTimeArgs) -> Option<Vec<SmallTX>> {
    // catch empty input
    if args.blocks.len() == 0 {
        return None;
    }

    // check authorised
    RUNTIME_STATE.with(|s| {
        s.borrow().data.check_admin(ic_cdk::caller().to_text())
    });

    let res = STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().tx_store.get_multiple_tx(args.blocks)
    });
    
    
    let mut ret_values: Vec<SmallTX> = Vec::new();
    let mut hits: bool = false;
    // time filter 
    for tx in res {
        match tx {
            Some(v) => {
                if v.time >= args.start && v.time <= args.end {
                    ret_values.push(v);
                    hits = true;
                }
            },
            None => {},
        }
    }
    
    if hits == true {
        ret_values.truncate(args.max_return as usize);
        return Some(ret_values);
    } else {
        return None
    }
}

#[query]
fn get_total_transactions() -> u64 {
    // check authorised
    RUNTIME_STATE.with(|s| {
        s.borrow().data.check_admin(ic_cdk::caller().to_text())
    });

    // total tx stored
    STABLE_STATE.with(|s|{
        s.borrow().as_ref().unwrap().tx_store.get_count()
    })
}

#[update] // Can only be called once during init 
fn canister_init() -> bool {
    let caller = ic_cdk::caller().to_text();
    let is_locked = RUNTIME_STATE.with(|s|{
        s.borrow().data.init_lock
    });
    if is_locked == true {
        return false;
    } else {
        RUNTIME_STATE.with(|s|{
            let mut state = s.borrow_mut(); 
            state.data.add_admin(caller.clone());
            state.data.add_authorised(caller);
            state.data.init_lock = false;
        });
        return true;
    }
}