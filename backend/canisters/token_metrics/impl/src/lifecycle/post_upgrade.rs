use bity_ic_canister_logger::LogEntry;
use bity_ic_canister_tracing_macros::trace;
use bity_ic_stable_memory::get_reader;
use ic_cdk_macros::post_upgrade;
use token_metrics_api::lifecycle::Args;
use tracing::info;

use crate::{memory::get_upgrades_memory, state::RuntimeState};

use super::init_canister;

#[post_upgrade]
#[trace]
fn post_upgrade(args: Args) {
    match args {
        Args::Init(_) => panic!(
            "Cannot upgrade the canister with an Init argument. Please provide an Upgrade argument."
        ),
        Args::Upgrade(upgrade_args) => {
            let memory = get_upgrades_memory();
            let reader = get_reader(&memory);

            let (mut state, logs, traces): (RuntimeState, Vec<LogEntry>, Vec<LogEntry>) =
                bity_ic_serializer::deserialize(reader).unwrap();

            state.env.set_version(upgrade_args.version);
            state.env.set_commit_hash(upgrade_args.commit_hash);

            bity_ic_canister_logger::init_with_logs(state.env.is_test_mode(), logs, traces);

            // Restart ledger indexer timer if it was previously configured
            // (IC timers don't survive upgrades — fee/decimals/target are in stable memory)
            let is_ledger_locked = state.data.ledger_indexer.target_ledger_locked;

            init_canister(state);

            if is_ledger_locked {
                crate::jobs::sync_ledger::start_processing_timer(60);
            }

            info!(version = %upgrade_args.version, "Post-upgrade complete");
        }
    }
}
