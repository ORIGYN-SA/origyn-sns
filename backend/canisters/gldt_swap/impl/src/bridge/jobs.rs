//! The bridge timers. Timers don't survive upgrades, so `start_jobs` sets them
//! again after init and every upgrade.

use crate::bridge::alerts::track_cycles;
use crate::bridge::gldt_ledger;
use crate::bridge::inbound::{has_inbound_work, process_round, IcMinter};
use crate::bridge::outbound::process_outbound;
use crate::bridge::rpc::IcEvmReader;
use crate::bridge::scraper::run_tick;
use crate::guards::{Job, JobGuard};
use crate::state::{mutate_state, read_state};
use gldt_swap_common::bridge::EvmChain;
use std::time::Duration;
use tracing::warn;
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

/// Runs the first tick at once on every chain without a start block. The first
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

/// Checks the cycle balance every minute. Then `bridge_process`, only
/// when there is work: first the mints whose outcome is unknown, then the outbound half (burns
/// whose outcome is unknown, and vouchers), then the mint queue, which waits while a mint is
/// still unknown. The outbound half always runs.
async fn bridge_process() {
    let (now, has_outbound_work) = mutate_state(|s| {
        let now = s.env.now_nanos();
        let cycles = s.env.cycles_balance();
        track_cycles(&mut s.data.bridge, cycles, now);
        (now, !s.data.bridge.outbound_work.is_empty())
    });
    if !has_outbound_work && !has_inbound_work() {
        return;
    }
    let Some(_guard) = JobGuard::new(Job::Process, now) else {
        return;
    };
    let (ledger, minting_owner) =
        read_state(|s| (gldt_ledger(&s.data.swap_configs), s.env.canister_id()));
    let minter = ledger
        .map(|ledger| IcMinter { ledger })
        .map_err(|e| warn!(error = %e, "inbound mints wait"))
        .ok();
    process_round(minter.as_ref(), minting_owner, process_outbound()).await;
}
