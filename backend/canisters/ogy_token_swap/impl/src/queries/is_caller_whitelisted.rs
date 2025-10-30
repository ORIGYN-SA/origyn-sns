use ic_cdk::query;
use crate::state::read_state;

#[query]
async fn is_caller_whitelisted() -> bool {
    read_state(|s| { s.is_caller_whitelisted_principal() })
}
