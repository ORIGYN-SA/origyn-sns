use crate::guards::caller_is_authorised_principal;
use crate::jobs::sync_ledger;
use ic_cdk_macros::update;

#[update(guard = "caller_is_authorised_principal")]
fn start_processing_timer(secs: u64) -> String {
    sync_ledger::start_processing_timer(secs);
    format!("Processing timer started with {}s interval", secs)
}
