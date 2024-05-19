use std::{ collections::HashMap, hash::Hash, ops::Deref, time::{ SystemTime, UNIX_EPOCH } };

use ic_cdk_macros::{ update, query };
use ic_stable_memory::collections::SBTreeMap;
use ic_cdk::api::time as ic_time;
use crate::core::{
    runtime::RUNTIME_STATE,
    stable_memory::STABLE_STATE,
    working_stats::api_count,
    utils::log,
};

use super::{
    account_tree::{ GetAccountBalanceHistory, HistoryData, Overview },
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

#[update]
fn get_account_balance_history(args: GetAccountBalanceHistory) -> Option<Vec<(u64, HistoryData)>> {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    // get ac_ref
    let ac_ref = STABLE_STATE.with(|s| {
        s.borrow().as_ref().unwrap().directory_data.get_ref(&args.account)
    });
    let acc = &args.account;
    let account_as_str = format!("Account to check: {acc:?}");
    log(account_as_str);
    match ac_ref {
        Some(ac_ref_value) => {
            // Logs start
            // STABLE_STATE.with(|s| {
            //     match s.borrow().as_ref().unwrap().principal_data.accounts_history.iter().last() {
            //         Some(v) => {
            //             log("get_account_balance_history -> last principal_data.account_history:");
            //             let lk = v.0.to_owned();
            //             let lv = v.1.to_owned();
            //             let last_message = format!("Key: {lk:?}, Value: {lv:?}");
            //             log(last_message);
            //         }
            //         None => {}
            //     }
            // });
            // Logs end

            let result = STABLE_STATE.with(|s| {
                let mut items: HashMap<u64, HistoryData> = HashMap::new();
                let mut days_collected = 0;

                let current_day = ic_time() / (86400 * 1_000_000_000);
                let start_day = if current_day > args.days {
                    current_day - args.days
                } else {
                    0
                };

                let stable_state = s.borrow();
                let state_ref = stable_state.as_ref().unwrap();

                let history_map = if args.merge_subaccounts {
                    &state_ref.principal_data.accounts_history
                } else {
                    &state_ref.account_data.accounts_history
                };

                for day in (start_day..=current_day).rev() {
                    let key = (ac_ref_value, day);

                    if let Some(history) = history_map.get(&key) {
                        log("found an item, pushing to array");
                        items.insert(day, history.clone());
                        days_collected += 1;
                        if days_collected >= args.days {
                            break;
                        }
                    }
                }
                let msg = format!("final items: {items:?}");
                log(msg);
                let vec: Vec<(u64, HistoryData)> = items.iter().map(|(&k, v)| (k, v.clone())).collect();
                Some(vec)
            });
            result
        }
        None => {
            log("return type 0, no ac_ref");
            None
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

// May not be needed
// #[query]
// fn get_merged_history_of_principal(principal_as_string: String) -> Option<Vec<(u64, HistoryData)>> {
//     // check authorised
//     RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
//     api_count();

//     let result =  STABLE_STATE.with(|s| {
//         let history_res = merge_history_of_a_principal(principal_as_string, &s.borrow().as_ref().unwrap().account_data.accounts_history);
//         match history_res.len() {
//             0 => return None,
//             _ => return Some(history_res)
//         }
//     });
//     result
// }

fn get_keys_for_last_x_days(account: u64, days: u64) -> Vec<(u64, u64)> {
    let mut keys = Vec::new();

    let now = ic_time();
    let current_day_number = now / (86400 * 1_000_000_000);

    for i in 0..days {
        keys.push((account, current_day_number - i));
    }

    keys
}
// May not be needed
// Could be removed if we can use principal_data.accounts
// and super_stats already has everything merged until the same principal
fn merge_history_of_a_principal(
    target_principal: String,
    map: &SBTreeMap<(u64, u64), HistoryData>
) -> Vec<(u64, HistoryData)> {
    // TODO: Last x days
    let mut result_map: HashMap<u64, HistoryData> = HashMap::new();
    for (key, value) in map.iter() {
        match STABLE_STATE.with(|s| { s.borrow().as_ref().unwrap().directory_data.get_id(&key.0) }) {
            Some(ac_as_string) => {
                match extract_principal_from_account(ac_as_string) {
                    Some(principal_as_string) => {
                        if principal_as_string == target_principal {
                            let day = key.1;
                            match result_map.get_mut(&day) {
                                Some(existing_value) => {
                                    *existing_value = existing_value.clone() + value.to_owned();
                                }
                                None => {
                                    result_map.insert(day, value.to_owned());
                                }
                            }
                        }
                    }
                    None => {}
                }
            }
            None => {}
        }
    }
    let result_as_vec: Vec<(u64, HistoryData)> = result_map.into_iter().collect();
    result_as_vec
}
fn extract_principal_from_account(input: String) -> Option<String> {
    if let Some(index) = input.find('.') {
        let (principal_str, _) = input.split_at(index);
        Some(principal_str.to_string())
    } else {
        None
    }
}
