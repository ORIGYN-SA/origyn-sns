use ic_cdk::query;
use crate::{
    core::working_stats::api_count,
    stats::history::{ fill_missing_days, get_history_of_account },
};
pub use super_stats_v3_api::{
    account_tree::HistoryData,
    runtime::RUNTIME_STATE,
    stats::queries::get_account_history::{
        Args as GetAccountHistoryArgs,
        Response as GetAccountHistoryResponse,
    },
};

#[query]
pub fn get_account_history(args: GetAccountHistoryArgs) -> GetAccountHistoryResponse {
    // check authorised
    RUNTIME_STATE.with(|s| { s.borrow().data.check_authorised(ic_cdk::caller().to_text()) });
    api_count();
    let history = get_history_of_account(args.account, args.days, false);
    let default_history_data = HistoryData {
        balance: 0,
    };
    let mut filled_history = fill_missing_days(history, args.days, default_history_data);
    let ret = filled_history.split_off(filled_history.len() - (args.days as usize));
    return ret;
}
