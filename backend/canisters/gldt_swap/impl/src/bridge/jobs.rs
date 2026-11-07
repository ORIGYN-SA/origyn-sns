//! The bridge timers (spec 8.15). Timers don't survive upgrades, so `start_jobs` sets them
//! again after init and every upgrade.

use crate::bridge::outbound::process_outbound;
use crate::bridge::rpc::IcEvmReader;
use crate::bridge::scraper::run_tick;
use crate::guards::{Job, JobGuard};
use crate::state::read_state;
use gldt_swap_common::bridge::EvmChain;
use std::time::Duration;
use utils::env::Environment;

/// `bridge_process` runs this often.
pub const PROCESS_INTERVAL: Duration = Duration::from_secs(60);

/// Base scrapes this long after Ethereum, so the two never call out at the same time.
pub const BASE_SCRAPE_OFFSET: Duration = Duration::from_secs(90);

pub fn start() {
    ic_cdk_timers::set_timer_interval(PROCESS_INTERVAL, bridge_process);

    // `bridge_scrape_ethereum` and `bridge_scrape_base`, every `scrape_interval_secs`
    let chains: Vec<(EvmChain, u64)> = read_state(|s| {
        s.data
            .bridge
            .config
            .iter()
            .flat_map(|c| &c.chains)
            .map(|c| (c.chain, c.scrape_interval_secs))
            .collect()
    });
    for (chain, secs) in chains {
        let offset = match chain {
            EvmChain::Ethereum => Duration::ZERO,
            EvmChain::Base => BASE_SCRAPE_OFFSET,
        };
        let interval = Duration::from_secs(secs);
        ic_cdk_timers::set_timer(offset, async move {
            ic_cdk_timers::set_timer_interval(interval, move || scrape(chain));
        });
    }
}

/// Runs the first tick at once on every chain without a start block (spec 7.5). The first
/// tick compares the token's signers with the canister's, so `load_signers` calls this when
/// both keys are loaded, right after init and every upgrade.
pub fn start_first_ticks() {
    let chains: Vec<EvmChain> = read_state(|s| {
        let bridge = &s.data.bridge;
        bridge
            .config
            .iter()
            .flat_map(|c| &c.chains)
            .map(|c| c.chain)
            .filter(|chain| {
                bridge
                    .chain_state(*chain)
                    .is_some_and(|c| c.start_block.is_none() && c.stopped.is_none())
            })
            .collect()
    });
    for chain in chains {
        ic_cdk_timers::set_timer(Duration::ZERO, scrape(chain));
    }
}

/// One scrape tick of `chain` under its job guard. Stopped chains do nothing. New burns
/// start the mint processor at once.
async fn scrape(chain: EvmChain) {
    let (now, evm_rpc) = read_state(|s| {
        (
            s.env.now_nanos(),
            s.data.bridge.config.as_ref().map(|c| c.evm_rpc_canister),
        )
    });
    let Some(evm_rpc) = evm_rpc else {
        return;
    };
    let Some(_guard) = JobGuard::new(Job::Scrape(chain), now) else {
        return;
    };
    if run_tick(&IcEvmReader { evm_rpc }, chain).await > 0 {
        ic_cdk_timers::set_timer(Duration::ZERO, bridge_process());
    }
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
