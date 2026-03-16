use bity_ic_canister_logger::LogEntry;
use bity_ic_canister_tracing_macros::trace;
use bity_ic_stable_memory::get_reader;
use ic_cdk_macros::post_upgrade;
use tracing::info;

use crate::{memory::get_upgrades_memory, state::RuntimeState};

use super::init_canister;

#[post_upgrade]
#[trace]
fn post_upgrade() {
    let memory = get_upgrades_memory();
    let reader = get_reader(&memory);

    let (runtime_state, logs, traces): (RuntimeState, Vec<LogEntry>, Vec<LogEntry>) =
        serializer::deserialize(reader).unwrap();

    bity_ic_canister_logger::init_with_logs(runtime_state.env.is_test_mode(), logs, traces);
    init_canister(runtime_state);

    info!("Post upgrade complete.")
}
