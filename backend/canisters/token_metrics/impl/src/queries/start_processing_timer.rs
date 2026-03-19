use ic_cdk_macros::update;
use crate::ledger_indexer::timer;

#[update]
fn start_processing_timer(secs: u64) -> String {
    timer::start_processing_timer(secs);
    format!("Processing timer started with {}s interval", secs)
}
