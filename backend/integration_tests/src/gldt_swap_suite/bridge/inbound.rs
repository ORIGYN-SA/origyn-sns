//! EVM to ICP: the scraper opens each chain at its first tick and finds burns on Ethereum
//! and Base (spec 7.5 and 8.7). The EVM nodes are mocked through PocketIC's HTTPS outcalls.

use crate::client::gldt_swap::get_bridge_status;
use crate::gldt_swap_suite::bridge::outcalls::{provider, rpc_method, serve_outcalls, MockEvm};
use crate::gldt_swap_suite::bridge::setup::{
    setup_bridge_env, start_all_chains, BridgeEnv, FAKE_BASE_TOKEN, FAKE_ETHEREUM_TOKEN, FIRST_HEAD,
};
use candid::Nat;
use gldt_swap_common::bridge::{ChainStatus, EvmChain, SupplyReadingStatus};
use pocket_ic::common::rest::{CanisterHttpRequest, CanisterHttpResponse};
use std::time::Duration;

/// 1 GLDT.
const ONE: u128 = 100_000_000;

fn chain(env: &BridgeEnv, chain: EvmChain) -> ChainStatus {
    get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &())
        .chains
        .into_iter()
        .find(|c| c.chain == chain)
        .unwrap()
}

/// Where the scraper stands: block, next burn id, window and supply reading.
fn cursor(c: &ChainStatus) -> (u64, u64, Option<u64>, Option<SupplyReadingStatus>) {
    (
        c.last_scraped_block,
        c.next_burn_id,
        c.window.as_ref().map(|w| w.end_burn_id),
        c.supply.clone(),
    )
}

/// Lets 3 minutes pass, so each chain runs one scrape tick, and answers its outcalls.
fn scrape_round(env: &BridgeEnv, handler: impl Fn(&CanisterHttpRequest) -> CanisterHttpResponse) {
    env.pic.advance_time(Duration::from_secs(180));
    serve_outcalls(&env.pic, handler);
}

/// Three confirmed burns of 1, 2 and 3 GLDT on `token`, and 6 GLDT supply left.
fn three_burns(env: &mut BridgeEnv, token: &str) {
    let user = env.user;
    env.evm.advance(20);
    for amount in [ONE, 2 * ONE, 3 * ONE] {
        env.evm.burn(token, user, amount);
        env.evm.advance(1);
    }
    env.evm.token_mut(token).total_supply = 6 * ONE;
    // past Base's 12 confirmations
    env.evm.advance(20);
}

#[test]
fn first_tick_opens_chains() {
    let mut env = setup_bridge_env();
    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(status.chains.iter().all(|c| c.start_block.is_none()));

    start_all_chains(&mut env);

    for (evm_chain, confirmations) in [(EvmChain::Ethereum, 3), (EvmChain::Base, 12)] {
        let c = chain(&env, evm_chain);
        let start = FIRST_HEAD - confirmations;
        assert_eq!(c.start_block, Some(start), "{evm_chain:?}");
        assert_eq!(c.last_scraped_block, start);
        assert_eq!(c.next_burn_id, 0);
        assert_eq!(c.window, None);
        assert_eq!(
            c.supply,
            Some(SupplyReadingStatus {
                block: start,
                total_supply: Nat::from(0u64)
            })
        );
        assert_eq!(c.failed_ticks, 0);
        assert_eq!(c.stopped, None);
        assert!(c.last_ok_at.is_some());
    }
    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(status.alerts.is_empty(), "{:?}", status.alerts);

    // with no new burn, the next tick moves the cursor and the supply reading
    env.evm.advance(100);
    scrape_round(&env, |r| env.evm.answer(r));
    let c = chain(&env, EvmChain::Ethereum);
    assert_eq!(c.last_scraped_block, FIRST_HEAD + 100 - 3);
    assert_eq!(c.window, None);
    assert_eq!(c.supply.unwrap().block, FIRST_HEAD + 100 - 3);
}

#[test]
fn providers_disagree_nothing_saved_then_recovers() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    three_burns(&mut env, FAKE_BASE_TOKEN);
    let before = chain(&env, EvmChain::Base);

    // 1. Ankr has not seen the last burn yet: the bridgeInfo() answers differ
    let mut behind = env.evm.clone();
    behind.token_mut(FAKE_BASE_TOKEN).next_burn_id = 2;
    scrape_round(&env, |r| {
        if rpc_method(r) == "eth_call" && provider(r) == "ankr" {
            behind.answer(r)
        } else {
            env.evm.answer(r)
        }
    });
    let after = chain(&env, EvmChain::Base);
    assert_eq!(cursor(&after), cursor(&before));
    assert_eq!(after.failed_ticks, 1);
    assert!(after.last_error.is_some());
    assert_eq!(after.stopped, None);

    // 2. they agree on bridgeInfo() but Ankr's logs miss a burn: the window opens and
    //    nothing is saved
    let mut missing = env.evm.clone();
    missing
        .token_mut(FAKE_BASE_TOKEN)
        .burns
        .retain(|b| b.burn_id != 2);
    scrape_round(&env, |r| {
        if rpc_method(r) == "eth_getLogs" && provider(r) == "ankr" {
            missing.answer(r)
        } else {
            env.evm.answer(r)
        }
    });
    let after = chain(&env, EvmChain::Base);
    assert_eq!(after.window.as_ref().map(|w| w.end_burn_id), Some(3));
    assert_eq!(after.next_burn_id, 0);
    assert_eq!(after.last_scraped_block, before.last_scraped_block);
    assert_eq!(after.supply, before.supply);
    assert_eq!(after.failed_ticks, 2);

    // 3. they agree: the window's three burns are saved and it closes with its supply
    scrape_round(&env, |r| env.evm.answer(r));
    let after = chain(&env, EvmChain::Base);
    let window_end = after.last_scraped_block;
    assert_eq!(after.next_burn_id, 3);
    assert_eq!(after.window, None);
    assert!(window_end > before.last_scraped_block);
    assert_eq!(
        after.supply,
        Some(SupplyReadingStatus {
            block: window_end,
            total_supply: Nat::from(6 * ONE)
        })
    );
    assert_eq!(after.failed_ticks, 0);

    // Ethereum agreed all along
    let eth = chain(&env, EvmChain::Ethereum);
    assert_eq!(eth.failed_ticks, 0);
    assert_eq!(eth.next_burn_id, 0);
}

#[test]
fn dropped_log_is_caught_by_id_check() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    three_burns(&mut env, FAKE_ETHEREUM_TOKEN);
    let before = chain(&env, EvmChain::Ethereum);

    // both providers agree on logs that miss burn 1: the batch is refused and nothing is saved
    let mut dropped = env.evm.clone();
    dropped
        .token_mut(FAKE_ETHEREUM_TOKEN)
        .burns
        .retain(|b| b.burn_id != 1);
    scrape_round(&env, |r| {
        if rpc_method(r) == "eth_getLogs" {
            dropped.answer(r)
        } else {
            env.evm.answer(r)
        }
    });
    let after = chain(&env, EvmChain::Ethereum);
    assert_eq!(after.window.as_ref().map(|w| w.end_burn_id), Some(3));
    assert_eq!(after.next_burn_id, 0);
    assert_eq!(after.last_scraped_block, before.last_scraped_block);
    assert_eq!(after.failed_ticks, 1);
    let error = after.last_error.unwrap();
    assert!(error.contains("Missing(1)"), "{error}");

    // every log comes back: the window is saved in id order and closes
    scrape_round(&env, |r| env.evm.answer(r));
    let after = chain(&env, EvmChain::Ethereum);
    assert_eq!(after.next_burn_id, 3);
    assert_eq!(after.window, None);
    assert_eq!(after.failed_ticks, 0);
    assert_eq!(after.supply.unwrap().total_supply, Nat::from(6 * ONE));
}

#[test]
fn head_too_high_retries() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    let before = [chain(&env, EvmChain::Ethereum), chain(&env, EvmChain::Base)];

    // the head endpoint reports blocks that don't exist yet: bridgeInfo() at such a block
    // fails on both providers, and nothing changes
    let liar = MockEvm {
        head: env.evm.chain_head + 1_000_000,
        ..env.evm.clone()
    };
    scrape_round(&env, |r| liar.answer(r));
    for before in &before {
        let after = chain(&env, before.chain);
        assert_eq!(cursor(&after), cursor(before), "{:?}", before.chain);
        assert_eq!(after.failed_ticks, 1);
        assert!(after.last_error.is_some());
        assert_eq!(after.stopped, None);
    }

    // an honest head: the next tick goes on
    env.evm.advance(10);
    scrape_round(&env, |r| env.evm.answer(r));
    for before in &before {
        let after = chain(&env, before.chain);
        assert!(after.last_scraped_block > before.last_scraped_block);
        assert_eq!(after.failed_ticks, 0);
    }
}
