use ic_cdk::query;
use crate::{
    core::working_stats::api_count,
    stats::history::{ fill_missing_days, get_history_of_account },
};
use super_stats_v3_api::{
    runtime::RUNTIME_STATE,
    stats::queries::get_principal_history::{ Args, Response },
};

#[query]
fn get_principal_history(args: Args) -> Response {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    let history = get_history_of_account(args.account, args.days, true);
    let mut filled_history = fill_missing_days(history, args.days);
    if filled_history.is_empty() {
        return Vec::new();
    }
    let ret = filled_history.split_off(filled_history.len() - (args.days as usize));
    return ret;
}
