use ic_cdk::query;
use crate::core::working_stats::api_count;
use super_stats_v3_api::{
    runtime::RUNTIME_STATE,
    stable_memory::STABLE_STATE,
    stats::queries::get_total_holders::Response,
};

#[query]
fn get_total_holders() -> Response {
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
    return Response {
        total_accounts: ac_len,
        total_principals: pr_len,
    };
}
