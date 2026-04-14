use bity_ic_canister_logger::LogEntry;
use ic_cdk_macros::query;

#[query]
fn get_logs() -> Vec<LogEntry> {
    bity_ic_canister_logger::export_logs()
}
