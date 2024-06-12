use ic_cdk_macros::pre_upgrade;
use stable_memory::get_writer;
use tracing::info;

use crate::{ memory::get_upgrades_memory, state::take_state };

#[pre_upgrade]
fn pre_upgrade() {
    info!("Pre upgrade.");

    let runtime_state = take_state();

    let logs = canister_logger::export_logs();
    let traces = canister_logger::export_traces();

    let stable_state = (runtime_state, logs, traces);

    let mut memory = get_upgrades_memory();
    let writer = get_writer(&mut memory);

    serializer::serialize(stable_state, writer).unwrap();
}
