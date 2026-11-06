//! The bridge timers (spec 8.15). Timers don't survive upgrades, so `start_jobs` sets them
//! again after init and every upgrade.

use crate::bridge::outbound::process_outbound;
use crate::guards::{Job, JobGuard};
use crate::state::read_state;
use std::time::Duration;
use utils::env::Environment;

/// `bridge_process` runs this often.
pub const PROCESS_INTERVAL: Duration = Duration::from_secs(60);

pub fn start() {
    ic_cdk_timers::set_timer_interval(PROCESS_INTERVAL, bridge_process);
}

/// `bridge_process`: settles burns whose outcome is unknown and signs vouchers. It has work
/// only while `outbound_work` is not empty. The inbound half is added with the mint processor.
async fn bridge_process() {
    let now = read_state(|s| s.env.now_nanos());
    let Some(_guard) = JobGuard::new(Job::Process, now) else {
        return;
    };
    process_outbound().await;
}
