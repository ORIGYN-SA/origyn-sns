use crate::state::read_state;
use ic_cdk::query;

#[query]
async fn is_caller_whitelisted() -> bool {
    read_state(|s| s.is_caller_whitelisted_principal())
}
