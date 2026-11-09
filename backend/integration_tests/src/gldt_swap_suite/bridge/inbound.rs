//! EVM to ICP: the scraper opens each chain at its first tick and finds burns on Ethereum
//! and Base, and the processor mints them on ICP under the supply guard.
//! The EVM nodes are mocked through PocketIC's HTTPS outcalls.

use crate::client::gldt_swap::{
    get_bridge_status, get_bridge_transfer_in, get_bridge_transfers_in_by_account,
    get_bridge_transfers_in_by_tx,
};
use crate::client::icrc1_icrc2_token::{icrc1_balance_of, icrc1_total_supply};
use crate::gldt_swap_suite::bridge::outcalls::{provider, rpc_method, serve_outcalls, MockEvm};
use crate::gldt_swap_suite::bridge::setup::{
    bridge_out, setup_bridge_env, start_all_chains, BridgeEnv, FAKE_BASE_TOKEN,
    FAKE_ETHEREUM_TOKEN, FIRST_HEAD,
};
use candid::{Nat, Principal};
use gldt_swap_common::bridge::{
    ChainStatus, EvmChain, InboundStatus, InboundTransfer, QueueSizes, SupplyReadingStatus,
};
use icrc_ledger_types::icrc1::account::Account;
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

    for (evm_chain, confirmations) in [(EvmChain::Ethereum, 12), (EvmChain::Base, 12)] {
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
    // the test canister holds 1,000 T cycles, far above the low cycles line
    assert!(status.cycles > Nat::from(100_000_000_000_000u64));

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

fn e8s(n: Nat) -> u128 {
    u128::try_from(n.0).unwrap()
}

fn balance(env: &BridgeEnv, owner: Principal) -> u128 {
    e8s(icrc1_balance_of(
        &env.pic,
        Principal::anonymous(),
        env.gldt_ledger_canister_id,
        &Account::from(owner),
    ))
}

fn total_supply(env: &BridgeEnv) -> u128 {
    e8s(icrc1_total_supply(
        &env.pic,
        Principal::anonymous(),
        env.gldt_ledger_canister_id,
        &(),
    ))
}

/// Lets a minute pass, so `bridge_process` runs again, and lets its calls finish.
fn process(env: &BridgeEnv) {
    env.pic.advance_time(Duration::from_secs(61));
    env.tick_n(10);
}

fn transfer_in(env: &BridgeEnv, chain: EvmChain, burn_id: u64) -> InboundTransfer {
    get_bridge_transfer_in(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &(chain, burn_id),
    )
    .unwrap_or_else(|| panic!("burn {burn_id} on {chain:?} is not saved"))
}

/// Alerts about the supply guard holding the mint queue.
fn guard_alerts(env: &BridgeEnv) -> usize {
    get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &())
        .alerts
        .iter()
        .filter(|a| a.message.contains("supply guard"))
        .count()
}

/// 10 GLDT go out to Base with `bridge_to_evm` and are claimed there.
fn ten_gldt_on_base(env: &mut BridgeEnv) {
    bridge_out(
        &env.pic,
        env.gldt_ledger_canister_id,
        env.gldt_swap_canister_id,
        env.user,
        EvmChain::Base,
        (10 * ONE) as u64,
    );
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply = 10 * ONE;
    env.evm.advance(5);
}

/// 4 GLDT burned on Base to the user's ICP account, past Base's 12 confirmations.
fn four_gldt_back_from_base(env: &mut BridgeEnv) {
    let user = env.user;
    env.evm.burn(FAKE_BASE_TOKEN, user, 4 * ONE);
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply -= 4 * ONE;
    env.evm.advance(20);
}

#[test]
fn evm_burn_is_minted_on_icp() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    ten_gldt_on_base(&mut env);
    four_gldt_back_from_base(&mut env);
    let balance_before = balance(&env, env.user);
    let supply_before = total_supply(&env);

    // the scrape saves the burn and starts the processor: 6 on Base + 4 unminted = 10 bridged out
    scrape_round(&env, |r| env.evm.answer(r));
    process(&env);

    let transfer = transfer_in(&env, EvmChain::Base, 0);
    assert!(
        matches!(transfer.status, InboundStatus::Minted { .. }),
        "{:?}",
        transfer.status
    );
    assert_eq!(transfer.amount, Nat::from(4 * ONE));
    assert_eq!(transfer.to, Account::from(env.user));
    assert_eq!(balance(&env, env.user), balance_before + 4 * ONE);
    assert_eq!(total_supply(&env), supply_before + 4 * ONE);

    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, Nat::from(6 * ONE));
    assert_eq!(status.out_pending, Nat::from(0u8));
    assert!(!status.supply_guard.holding);
    assert_eq!(status.supply_guard.evm_side, Nat::from(6 * ONE));
    assert_eq!(status.queue, QueueSizes::default());
    assert_eq!(guard_alerts(&env), 0);

    // the lookups find it; the hash matches in any case
    assert_eq!(
        get_bridge_transfers_in_by_tx(
            &env.pic,
            env.user,
            env.gldt_swap_canister_id,
            &(EvmChain::Base, transfer.tx_hash.to_uppercase()),
        ),
        vec![transfer.clone()]
    );
    assert_eq!(
        get_bridge_transfers_in_by_account(
            &env.pic,
            env.user,
            env.gldt_swap_canister_id,
            &(Account::from(env.user), None, 10),
        ),
        vec![transfer.clone()]
    );

    // later runs mint nothing more
    process(&env);
    scrape_round(&env, |r| env.evm.answer(r));
    process(&env);
    assert_eq!(balance(&env, env.user), balance_before + 4 * ONE);
    assert_eq!(transfer_in(&env, EvmChain::Base, 0), transfer);
}

#[test]
fn forged_supply_holds_mints_until_resolved() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    ten_gldt_on_base(&mut env);
    // a forged LayerZero message mints 5 GLDT on Ethereum that were never bridged out
    env.evm.token_mut(FAKE_ETHEREUM_TOKEN).total_supply = 5 * ONE;
    env.evm.advance(20);
    scrape_round(&env, |r| env.evm.answer(r));
    assert_eq!(
        chain(&env, EvmChain::Ethereum).supply.unwrap().total_supply,
        Nat::from(5 * ONE)
    );

    // 4 honest GLDT come back from Base: 5 + 6 + 4 = 15 is above the 10 bridged out
    four_gldt_back_from_base(&mut env);
    let balance_before = balance(&env, env.user);
    scrape_round(&env, |r| env.evm.answer(r));
    process(&env);
    // several minutes of holding raise one alert
    for _ in 0..3 {
        scrape_round(&env, |r| env.evm.answer(r));
        process(&env);
    }

    assert_eq!(
        transfer_in(&env, EvmChain::Base, 0).status,
        InboundStatus::Queued
    );
    assert_eq!(balance(&env, env.user), balance_before);
    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(status.supply_guard.holding);
    assert_eq!(status.supply_guard.evm_side, Nat::from(15 * ONE));
    assert_eq!(status.supply_guard.icp_side, Nat::from(10 * ONE));
    assert_eq!(status.bridged_out, Nat::from(10 * ONE));
    assert_eq!(status.queue.queued, 1);
    assert_eq!(guard_alerts(&env), 1, "{:?}", status.alerts);

    // the Ethereum reading lines up again, and minting resumes by itself. (An SNS
    // InboundReject of a forged burn is the other way out; it comes with the SNS actions.)
    env.evm.token_mut(FAKE_ETHEREUM_TOKEN).total_supply = 0;
    env.evm.advance(20);
    scrape_round(&env, |r| env.evm.answer(r));
    process(&env);

    assert!(matches!(
        transfer_in(&env, EvmChain::Base, 0).status,
        InboundStatus::Minted { .. }
    ));
    assert_eq!(balance(&env, env.user), balance_before + 4 * ONE);
    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(!status.supply_guard.holding);
    assert_eq!(status.bridged_out, Nat::from(6 * ONE));
    assert_eq!(guard_alerts(&env), 1);
}
