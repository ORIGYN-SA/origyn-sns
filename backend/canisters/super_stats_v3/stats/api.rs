use std::ops::Deref;

use ic_cdk_macros::{ update, query };

use crate::core::{
    runtime::RUNTIME_STATE,
    stable_memory::STABLE_STATE,
    working_stats::api_count,
    utils::log,
};

use super::{
    account_tree::Overview,
    constants::HOUR_AS_NANOS,
    custom_types::{
        GetHoldersArgs,
        HolderBalance,
        HolderBalanceResponse,
        IndexerType,
        ProcessedTX,
        TimeStats,
        TotalHolderResponse,
    },
    directory::lookup_directory,
    fetch_data::{
        dfinity_icp::{ t1_impl_set_target_canister, SetTargetArgs },
        dfinity_icrc2::t2_impl_set_target_canister,
    },
    process_data::process_time_stats::{ calculate_time_stats, StatsType },
};

// [][] -- ADMIN GATED -- [][]
#[update]
pub async fn init_target_ledger(args: SetTargetArgs, index_type: IndexerType) -> String {
    // check admin
    RUNTIME_STATE.with(|s| { s.borrow().data.check_admin(ic_cdk::caller().to_text()) });
    // select route
    match index_type {
        IndexerType::DfinityIcp => {
            let res = t1_impl_set_target_canister(args).await;
            match res {
                Ok(v) => {
                    RUNTIME_STATE.with(|s| { s.borrow_mut().data.set_index_type(index_type) });
                    return v;
                }
                Err(e) => {
                    return e;
                }
            }
        }
        IndexerType::DfinityIcrc2 => {
            let res = t2_impl_set_target_canister(args).await;
            match res {
                Ok(v) => {
                    RUNTIME_STATE.with(|s| { s.borrow_mut().data.set_index_type(index_type) });
                    return v;
                }
                Err(e) => {
                    return e;
                }
            }
        }
        IndexerType::DfinityIcrc3 => {
            return String::from("Route not yet created");
        }
    }
}

// [][] -- AUTH GATED -- [][]
// total holders ☑️
// top holders ☑️
// account balance  ☑️
// principal balance ☑️
// get hourly stats ☑️
// get daily stats ☑️

#[query]
fn get_top_account_holders(number_to_return: u64) -> Vec<HolderBalanceResponse> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });

    let top: Vec<HolderBalance> = STABLE_STATE.with(|s| {
        let mut ac_vec: Vec<HolderBalance> = Vec::new();
        for ac in s.borrow().as_ref().unwrap().account_data.accounts.iter() {
            let refs = ac.0.clone();
            let ov = ac.1.clone();
            ac_vec.push(HolderBalance {
                holder: refs,
                data: ov,
            });
        }

        // catch 0 result
        if ac_vec.len() == 0 {
            return ac_vec;
        }

        ac_vec.sort_unstable_by_key(|element| element.data.balance);
        ac_vec.reverse();
        let mut top_ac: Vec<HolderBalance> = Vec::new();
        for i in 0..number_to_return as usize {
            top_ac.push(ac_vec[i].to_owned());
        }
        api_count();
        return top_ac;
    });

    // replace ref with full accounts
    let mut return_data: Vec<HolderBalanceResponse> = Vec::new();
    for ad in top {
        let ac = lookup_directory(ad.holder);
        match ac {
            Some(v) => {
                return_data.push(HolderBalanceResponse {
                    holder: v,
                    data: ad.data,
                });
            }
            None => {} // do nothing
        }
    }
    api_count();
    return return_data;
}

#[query]
fn get_top_principal_holders(number_to_return: u64) -> Vec<HolderBalanceResponse> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });

    let top: Vec<HolderBalance> = STABLE_STATE.with(|s| {
        let mut ac_vec: Vec<HolderBalance> = Vec::new();
        for ac in s.borrow().as_ref().unwrap().principal_data.accounts.iter() {
            let refs = ac.0.clone();
            let ov = ac.1.clone();
            ac_vec.push(HolderBalance {
                holder: refs,
                data: ov,
            });
        }

        // catch 0 result
        if ac_vec.len() == 0 {
            return ac_vec;
        }

        ac_vec.sort_unstable_by_key(|element| element.data.balance);
        ac_vec.reverse();
        let mut top_ac: Vec<HolderBalance> = Vec::new();
        for i in 0..number_to_return as usize {
            top_ac.push(ac_vec[i].to_owned());
        }
        api_count();
        return top_ac;
    });

    // replace ref with full accounts
    let mut return_data: Vec<HolderBalanceResponse> = Vec::new();
    for ad in top {
        let ac = lookup_directory(ad.holder);
        match ac {
            Some(v) => {
                return_data.push(HolderBalanceResponse {
                    holder: v,
                    data: ad.data,
                });
            }
            None => {} // do nothing
        }
    }
    api_count();
    return return_data;
}

#[query]
fn get_principal_holders(args: GetHoldersArgs) -> Vec<HolderBalanceResponse> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });

    let top: Vec<HolderBalance> = STABLE_STATE.with(|s| {
        let mut ac_vec: Vec<HolderBalance> = Vec::new();
        for ac in s.borrow().as_ref().unwrap().principal_data.accounts.iter() {
            let refs = ac.0.clone();
            let ov = ac.1.clone();
            ac_vec.push(HolderBalance {
                holder: refs,
                data: ov,
            });
        }

        // catch 0 result
        if ac_vec.is_empty() {
            return Vec::new();
        }

        ac_vec.sort_unstable_by_key(|element| element.data.balance);
        ac_vec.reverse();

        let start_index = args.offset as usize;
        let end_index = (args.offset + args.limit) as usize;

        // Ensure end_index doesn't exceed the vector length
        let end_index = if end_index > ac_vec.len() { ac_vec.len() } else { end_index };

        ac_vec[start_index..end_index].to_vec()
    });

    // replace ref with full accounts
    let mut return_data: Vec<HolderBalanceResponse> = Vec::new();
    for ad in top {
        let ac = lookup_directory(ad.holder);
        if let Some(v) = ac {
            return_data.push(HolderBalanceResponse {
                holder: v,
                data: ad.data,
            });
        }
    }
    api_count();
    return return_data;
}

#[query]
fn get_account_holders(args: GetHoldersArgs) -> Vec<HolderBalanceResponse> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });

    let top: Vec<HolderBalance> = STABLE_STATE.with(|s| {
        let mut ac_vec: Vec<HolderBalance> = Vec::new();
        for ac in s.borrow().as_ref().unwrap().account_data.accounts.iter() {
            let refs = ac.0.clone();
            let ov = ac.1.clone();
            ac_vec.push(HolderBalance {
                holder: refs,
                data: ov,
            });
        }

        // catch 0 result
        if ac_vec.is_empty() {
            return Vec::new();
        }

        ac_vec.sort_unstable_by_key(|element| element.data.balance);
        ac_vec.reverse();

        let start_index = args.offset as usize;
        let end_index = (args.offset + args.limit) as usize;

        // Ensure end_index doesn't exceed the vector length
        let end_index = if end_index > ac_vec.len() { ac_vec.len() } else { end_index };

        ac_vec[start_index..end_index].to_vec()
    });

    // replace ref with full accounts
    let mut return_data: Vec<HolderBalanceResponse> = Vec::new();
    for ad in top {
        let ac = lookup_directory(ad.holder);
        if let Some(v) = ac {
            return_data.push(HolderBalanceResponse {
                holder: v,
                data: ad.data,
            });
        }
    }
    api_count();
    return return_data;
}

#[query]
fn get_total_holders() -> TotalHolderResponse {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });

    // account count
    let ac_len = STABLE_STATE.with(|s| {
        s.borrow().as_ref().unwrap().account_data.accounts.len()
    });

    // principal count
    let pr_len = STABLE_STATE.with(|s| {
        s.borrow().as_ref().unwrap().principal_data.accounts.len()
    });
    api_count();
    return TotalHolderResponse {
        total_accounts: ac_len,
        total_principals: pr_len,
    };
}

#[query]
fn get_hourly_stats() -> TimeStats {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    RUNTIME_STATE.with(|s| { s.borrow().data.hourly_stats.clone() })
}

#[query]
fn get_daily_stats() -> TimeStats {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    RUNTIME_STATE.with(|s| { s.borrow().data.daily_stats.clone() })
}

#[query]
fn get_account_overview(account: String) -> Option<Overview> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    // get ac_ref
    let ac_ref = STABLE_STATE.with(|s| {
        s.borrow().as_ref().unwrap().directory_data.get_ref(&account)
    });
    match ac_ref {
        Some(v) => {
            let ret = STABLE_STATE.with(|s| {
                match s.borrow().as_ref().unwrap().account_data.accounts.get(&v) {
                    Some(v) => {
                        let ov = v.to_owned();
                        return Some(ov);
                    }
                    None => {
                        return None;
                    }
                }
            });
            return ret;
        }
        None => {
            return None;
        }
    }
}

#[query]
fn get_principal_overview(account: String) -> Option<Overview> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    // get ac_ref
    let ac_ref = STABLE_STATE.with(|s| {
        s.borrow().as_ref().unwrap().directory_data.get_ref(&account)
    });
    match ac_ref {
        Some(v) => {
            let ret = STABLE_STATE.with(|s| {
                match s.borrow().as_ref().unwrap().principal_data.accounts.get(&v) {
                    Some(v) => {
                        let ov = v.to_owned();
                        return Some(ov);
                    }
                    None => {
                        return None;
                    }
                }
            });
            return ret;
        }
        None => {
            return None;
        }
    }
}
