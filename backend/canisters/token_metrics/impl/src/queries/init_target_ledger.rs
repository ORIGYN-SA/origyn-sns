use ic_cdk_macros::update;
use token_metrics_api::types::ledger_indexer::InitLedgerArgs;
use crate::ledger_indexer::fetch_data::dfinity_icrc2::t2_impl_set_target_canister;
use crate::ledger_indexer::timer::start_processing_timer;

#[update]
async fn init_target_ledger(args: InitLedgerArgs) -> String {
    match t2_impl_set_target_canister(args.target).await {
        Ok(msg) => {
            // Start the processing timer with a default 60-second interval
            start_processing_timer(60);
            msg
        }
        Err(e) => e,
    }
}
