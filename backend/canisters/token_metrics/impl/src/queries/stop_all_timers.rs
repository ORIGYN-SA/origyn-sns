use ic_cdk_macros::update;
use crate::ledger_indexer::timer;

#[update]
fn stop_all_timers() -> String {
    timer::stop_all_timers();
    "All timers stopped".to_string()
}
