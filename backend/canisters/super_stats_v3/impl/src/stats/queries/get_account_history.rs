use ic_cdk::update;
use std::collections::HashMap;
use crate::{ core::working_stats::api_count, stats::utils::get_current_day };
use super_stats_v3_api::{
    account_tree::HistoryData,
    runtime::RUNTIME_STATE,
    stable_memory::STABLE_STATE,
    stats::queries::get_account_history::{ Args, Response },
};

#[update]
fn get_account_history(args: Args) -> Response {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    let history = get_account_last_days(args.clone());
    let mut filled_history = fill_missing_days(history, args.days);
    filled_history.truncate(args.days as usize);
    return filled_history;
}
fn fill_missing_days(mut history: Response, days: u64) -> Response {
    history.sort_by_key(|&(day, _)| day);

    let mut filled_history = Vec::new();
    let mut last_data: Option<&HistoryData> = None;
    let current_day = get_current_day();

    for day_offset in 0..=days {
        let day = current_day - day_offset;

        match history.iter().find(|&&(d, _)| d == day) {
            Some(&(_, ref data)) => {
                filled_history.push((day, data.clone()));
                last_data = Some(data);
            }
            None => {
                if let Some(data) = last_data {
                    filled_history.push((day, data.clone()));
                }
            }
        }
    }

    filled_history
}
pub fn get_account_last_days(args: Args) -> Vec<(u64, HistoryData)> {
    // get ac_ref
    let ac_ref = STABLE_STATE.with(|s| {
        s.borrow().as_ref().unwrap().directory_data.get_ref(&args.account)
    });
    match ac_ref {
        Some(ac_ref_value) => {
            let result = STABLE_STATE.with(|s| {
                let mut items: HashMap<u64, HistoryData> = HashMap::new();
                let mut days_collected = 0;

                let current_day = get_current_day();
                let start_day = if current_day > args.days { current_day - args.days } else { 0 };

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
                        items.insert(day, history.clone());
                        days_collected += 1;
                        if days_collected >= args.days {
                            break;
                        }
                    }
                }
                let msg = format!("final items: {items:?}");
                // log(msg);
                let vec: Vec<(u64, HistoryData)> = items
                    .iter()
                    .map(|(&k, v)| (k, v.clone()))
                    .collect();
                return vec;
            });
            return result;
        }
        None => {
            // log("return type 0, no ac_ref");
            let ret: Vec<(u64, HistoryData)> = Vec::new();
            ret
        }
    }
}
