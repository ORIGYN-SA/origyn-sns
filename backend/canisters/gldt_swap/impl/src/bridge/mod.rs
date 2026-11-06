//! The GLDT bridge between ICP, Ethereum and Base.

pub mod config;
pub mod evm;
pub mod signer;
pub mod stable;
pub mod state;

use crate::state::read_state;
use std::time::Duration;

/// Starts the bridge timers after init and every upgrade (timers don't survive upgrades).
/// Does nothing while the bridge has no config.
pub fn start_jobs() {
    if read_state(|s| s.data.bridge.config.is_none()) {
        return;
    }
    ic_cdk_timers::set_timer(Duration::ZERO, signer::load_signers());
}
