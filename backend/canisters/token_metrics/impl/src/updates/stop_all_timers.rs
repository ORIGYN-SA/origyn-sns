use crate::jobs::sync_ledger;
use ic_cdk_macros::update;

#[update]
fn stop_all_timers() -> String {
    sync_ledger::stop_all_timers();
    "All timers stopped".to_string()
}
