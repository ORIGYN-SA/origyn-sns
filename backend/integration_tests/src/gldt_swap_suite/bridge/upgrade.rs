use crate::client::gldt_swap::{
    bridge_pause, bridge_to_evm, get_bridge_evm_signers, get_bridge_status, get_bridge_transfer_in,
    get_bridge_transfer_out,
};
use crate::client::icrc1_icrc2_token::{icrc1_balance_of, icrc2_approve};
use crate::gldt_swap_suite::bridge::outcalls::{
    node_error, requested_burn_ids, rpc_method, serve_outcalls,
};
use crate::gldt_swap_suite::bridge::setup::{
    bridge_config, bridge_out, bridge_upgrade, chain_config, ledger_log_length, ledger_transaction,
    lose_next_ledger_reply, setup_bridge_env, start_all_chains, wait_for_signers, BridgeEnv,
    BridgeEnvBuilder, LedgerCall, FAKE_BASE_TOKEN,
};
use candid::{encode_one, Nat, Principal};
use gldt_swap_common::bridge::{
    BridgePauseArgs, BridgeToEvmArgs, BridgeUpgrade, ChainReset, ChainStatus, EvmChain,
    GetBridgeEvmSignersResponse, InboundStatus, OutboundStatus,
};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::Memo;
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use std::cell::RefCell;
use std::time::Duration;

fn is_eip55_text(address: &str) -> bool {
    address.len() == 42
        && address.starts_with("0x")
        && address[2..].bytes().all(|b| b.is_ascii_hexdigit())
}

#[test]
fn upgrade_with_bridge_config_loads_signers() {
    let env = BridgeEnvBuilder::new().without_bridge_at_init().build();
    env.tick_n(3);
    assert_eq!(
        get_bridge_evm_signers(&env.pic, env.controller, env.gldt_swap_canister_id, &()),
        GetBridgeEvmSignersResponse {
            claims: None,
            admin: None
        }
    );
    assert!(
        !get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &()).configured
    );

    env.upgrade_gldt_swap(Some(bridge_upgrade(env.sns_governance)))
        .expect("upgrade with a bridge config");
    let (claims, admin) = wait_for_signers(&env);

    assert!(is_eip55_text(&claims), "claims address {claims}");
    assert!(is_eip55_text(&admin), "admin address {admin}");
    assert_ne!(claims, admin);

    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(status.configured);
    assert_eq!(status.claims_signer, Some(claims));
    assert_eq!(status.admin_signer, Some(admin));
    assert_eq!(status.chains.len(), 2);
    assert!(status.chains.iter().all(|c| c.stopped.is_none()));
    assert_eq!(status.bridged_out, 0u64);
    assert_eq!(status.out_pending, 0u64);
}

#[test]
fn init_with_bridge_config_loads_signers_and_upgrade_keeps_them() {
    let mut env = setup_bridge_env();
    // all three canisters share the fiduciary subnet, which holds the threshold keys
    let subnet = env.pic.get_subnet(env.gldt_swap_canister_id);
    assert!(subnet.is_some());
    assert_eq!(env.pic.get_subnet(env.gldt_ledger_canister_id), subnet);
    assert_eq!(env.pic.get_subnet(env.evm_rpc_canister_id), subnet);

    let (claims, admin) = wait_for_signers(&env);
    assert_ne!(claims, admin);
    // the first ticks are answered, so no outcall is pending during the upgrade
    start_all_chains(&mut env);

    // an upgrade without a bridge argument keeps the config, and the same key gives the same addresses
    env.upgrade_gldt_swap(None).expect("plain upgrade");
    let after = wait_for_signers(&env);
    assert_eq!(after, (claims, admin));
    assert!(get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &()).configured);
}

#[test]
fn invalid_bridge_upgrade_is_rejected_and_state_kept() {
    let mut env = setup_bridge_env();
    let signers = wait_for_signers(&env);
    start_all_chains(&mut env);

    let mut config = bridge_config(env.sns_governance);
    config.chains[0].confirmations = 0;
    let bad_config = BridgeUpgrade {
        config: Some(config),
        chain_resets: vec![],
    };
    let rejected = env.upgrade_gldt_swap(Some(bad_config)).unwrap_err();
    assert!(
        rejected
            .reject_message
            .contains("invalid bridge upgrade argument: Ethereum: confirmations must be above 0"),
        "{rejected}"
    );

    // a reset of a chain that is not stopped is refused too
    let bad_reset = BridgeUpgrade {
        config: None,
        chain_resets: vec![ChainReset {
            chain: EvmChain::Base,
            last_scraped_block: 1,
            next_burn_id: 0,
        }],
    };
    let rejected = env.upgrade_gldt_swap(Some(bad_reset)).unwrap_err();
    assert!(
        rejected
            .reject_message
            .contains("chain reset: Base is not stopped"),
        "{rejected}"
    );

    assert_eq!(wait_for_signers(&env), signers);
    assert!(get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &()).configured);
}

#[test]
fn bridge_pause_is_for_authorized_principals_and_only_pauses() {
    let env = setup_bridge_env();

    let stranger = crate::utils::random_principal();
    let rejected = env.pic.update_call(
        env.gldt_swap_canister_id,
        stranger,
        "bridge_pause",
        encode_one(BridgePauseArgs {
            inbound: true,
            outbound: true,
        })
        .unwrap(),
    );
    assert!(rejected.is_err());

    // other bridge alerts may exist already, so count only the ones the pause adds
    let alerts_before =
        get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &()).alerts_total;
    bridge_pause(
        &env.pic,
        env.controller,
        env.gldt_swap_canister_id,
        &BridgePauseArgs {
            inbound: false,
            outbound: true,
        },
    );
    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(status.paused_out);
    assert!(!status.paused_in);
    assert_eq!(status.alerts_total, alerts_before + 1);
    assert!(status
        .alerts
        .iter()
        .any(|alert| alert.message.contains("outbound paused by")));

    // false never unpauses
    bridge_pause(
        &env.pic,
        env.controller,
        env.gldt_swap_canister_id,
        &BridgePauseArgs {
            inbound: false,
            outbound: false,
        },
    );
    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert!(status.paused_out);
    assert!(!status.paused_in);
    // nothing changed, so no new alert
    assert_eq!(status.alerts_total, alerts_before + 1);
}

/// 1 GLDT.
const ONE: u128 = 100_000_000;
const BASE_CHAIN_ID: u64 = 8453;

fn base(env: &BridgeEnv) -> ChainStatus {
    get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &())
        .chains
        .into_iter()
        .find(|c| c.chain == EvmChain::Base)
        .unwrap()
}

fn balance(env: &BridgeEnv) -> u128 {
    let e8s = icrc1_balance_of(
        &env.pic,
        Principal::anonymous(),
        env.gldt_ledger_canister_id,
        &Account::from(env.user),
    );
    u128::try_from(e8s.0).unwrap()
}

fn inbound_status(env: &BridgeEnv, burn_id: u64) -> InboundStatus {
    get_bridge_transfer_in(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &(EvmChain::Base, burn_id),
    )
    .unwrap_or_else(|| panic!("Base burn {burn_id} is not saved"))
    .status
}

fn outbound_status(env: &BridgeEnv, id: u64) -> OutboundStatus {
    get_bridge_transfer_out(&env.pic, env.user, env.gldt_swap_canister_id, &id)
        .unwrap_or_else(|| panic!("no outbound {id}"))
        .status
}

/// The mint memo, built by hand: `GLDT-IN`, the chain id and the burn id, big endian.
fn in_memo(chain_id: u64, burn_id: u64) -> Memo {
    Memo::from(
        [
            &b"GLDT-IN"[..],
            &chain_id.to_be_bytes(),
            &burn_id.to_be_bytes(),
        ]
        .concat(),
    )
}

/// The burn memo, built by hand: `GLDT-OUT` and the outbound id, big endian.
fn out_memo(id: u64) -> Memo {
    Memo::from([&b"GLDT-OUT"[..], &id.to_be_bytes()].concat())
}

/// Ticks until `done` holds, without moving the clock, so no scrape tick starts.
fn tick_until(env: &BridgeEnv, what: &str, done: impl Fn() -> bool) {
    for _ in 0..50 {
        if done() {
            return;
        }
        env.pic.tick();
    }
    panic!("{what} did not happen within 50 rounds");
}

/// Spec 9.4 and 9.8: an upgrade loses no work. gldt_swap is upgraded with a scrape window half
/// saved, a mint and a burn whose answers were lost after the ledger ran them. Afterwards the
/// window goes on from the saved burn id, and both retries, with the same memo and
/// `created_at_time`, settle as `Duplicate` at the first call's block. Nothing moves twice.
#[test]
fn upgrade_mid_window_and_with_unknowns_resumes() {
    // Base asks for 2 burn ids per log call, so its 4 burns take two batches
    let mut base_config = chain_config(EvmChain::Base);
    base_config.log_batch_size = 2;
    let mut env = BridgeEnvBuilder::new()
        .with_chains(vec![chain_config(EvmChain::Ethereum), base_config])
        .build();
    start_all_chains(&mut env);
    let gldt_swap = env.gldt_swap_canister_id;
    let ledger = env.gldt_ledger_canister_id;
    let user = env.user;

    // 10 GLDT go out to Base and are claimed there, so burns back can be minted
    bridge_out(
        &env.pic,
        ledger,
        gldt_swap,
        user,
        EvmChain::Base,
        (10 * ONE) as u64,
    );
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply = 10 * ONE;
    // four burns of 1 GLDT back to the user, past Base's 12 confirmations
    env.evm.advance(1);
    for _ in 0..4 {
        env.evm.burn(FAKE_BASE_TOKEN, user, ONE);
    }
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply = 6 * ONE;
    env.evm.advance(20);
    let balance_start = balance(&env);

    // 1. The window opens and its first batch, burns 0 and 1, is saved. The second batch
    //    fails, so the window stays open at burn 2. The saved burns start the processor:
    //    the mint of burn 0 runs on the ledger, and gldt_swap loses the answer.
    lose_next_ledger_reply(&env, LedgerCall::Mint);
    env.pic.advance_time(Duration::from_secs(180));
    serve_outcalls(&env.pic, |r| {
        if rpc_method(r) == "eth_getLogs" && requested_burn_ids(r).contains(&2) {
            node_error(r, "request timed out")
        } else {
            env.evm.answer(r)
        }
    });
    let mid = base(&env);
    assert_eq!(mid.next_burn_id, 2);
    let window = mid.window.clone().expect("the window is still open");
    assert_eq!(window.end_burn_id, 4);
    assert_eq!(mid.failed_ticks, 1);

    let mint_block = ledger_log_length(&env.pic, ledger) - 1;
    let mint = ledger_transaction(&env.pic, ledger, mint_block)
        .mint
        .expect("the last ledger block is the mint");
    assert_eq!(mint.to, Account::from(user));
    assert_eq!(mint.amount, ONE);
    assert_eq!(mint.memo, Some(in_memo(BASE_CHAIN_ID, 0)));
    assert_eq!(balance(&env), balance_start + ONE);
    assert_eq!(inbound_status(&env, 0), InboundStatus::MintUnknown);
    // new mints wait while one is unknown
    assert_eq!(inbound_status(&env, 1), InboundStatus::Queued);

    // 2. The user bridges 1 GLDT out to Ethereum: the burn runs on the ledger, and gldt_swap
    //    loses the answer
    let approved = icrc2_approve(
        &env.pic,
        user,
        ledger,
        &ApproveArgs {
            from_subaccount: None,
            spender: Account::from(gldt_swap),
            amount: Nat::from(ONE),
            expected_allowance: None,
            expires_at: None,
            fee: None,
            memo: None,
            created_at_time: None,
        },
    );
    assert!(
        matches!(approved, icrc2_approve::Response::Ok(_)),
        "{approved:?}"
    );
    let balance_before_burn = balance(&env);
    lose_next_ledger_reply(&env, LedgerCall::Burn);
    let out = bridge_to_evm(
        &env.pic,
        user,
        gldt_swap,
        &BridgeToEvmArgs {
            chain: EvmChain::Ethereum,
            recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".to_string(),
            amount: Nat::from(ONE),
            from_subaccount: None,
        },
    )
    .expect("an unknown outcome is not an error");
    assert_eq!(out.status, OutboundStatus::BurnUnknown);

    let burn_block = ledger_log_length(&env.pic, ledger) - 1;
    let burn = ledger_transaction(&env.pic, ledger, burn_block)
        .burn
        .expect("the last ledger block is the burn");
    assert_eq!(burn.from, Account::from(user));
    assert_eq!(burn.amount, ONE);
    assert_eq!(burn.memo, Some(out_memo(out.id)));
    assert_eq!(burn.created_at_time, Some(out.created_at));
    assert_eq!(balance(&env), balance_before_burn - ONE);
    let before = get_bridge_status(&env.pic, env.controller, gldt_swap, &());
    assert_eq!(before.bridged_out, Nat::from(10 * ONE));
    assert_eq!(before.out_pending, Nat::from(ONE));

    // 3. Nothing is in flight: no outcall is pending. Upgrade with the same wasm.
    env.tick_n(5);
    assert!(env.pic.get_canister_http().is_empty());
    env.upgrade_gldt_swap(None).expect("upgrade");
    assert_eq!(base(&env).window, Some(window.clone()));
    assert_eq!(inbound_status(&env, 0), InboundStatus::MintUnknown);
    assert_eq!(outbound_status(&env, out.id), OutboundStatus::BurnUnknown);

    // 4. The timers start again. A minute later the processor retries both calls with the
    //    same arguments; the ledger answers Duplicate with the first call's block. 90 s also
    //    starts Base's scrape interval.
    env.pic.advance_time(Duration::from_secs(90));
    serve_outcalls(&env.pic, |r| env.evm.answer(r));
    tick_until(&env, "the burn's voucher", || {
        matches!(outbound_status(&env, out.id), OutboundStatus::Signed(_))
    });
    assert_eq!(
        inbound_status(&env, 0),
        InboundStatus::Minted {
            icp_block_index: mint_block
        }
    );
    let OutboundStatus::Signed(voucher) = outbound_status(&env, out.id) else {
        unreachable!()
    };
    assert_eq!(voucher.icp_burn_index, burn_block);
    assert_eq!(voucher.amount, Nat::from(ONE));

    // 5. The next Base tick continues the saved window from burn 2 and closes it
    let asked = RefCell::new(Vec::new());
    env.pic.advance_time(Duration::from_secs(180));
    serve_outcalls(&env.pic, |r| {
        if rpc_method(r) == "eth_getLogs" {
            asked.borrow_mut().push(requested_burn_ids(r));
        }
        env.evm.answer(r)
    });
    let asked = asked.into_inner();
    assert!(!asked.is_empty());
    assert!(asked.iter().all(|ids| ids == &vec![2, 3]), "{asked:?}");
    let after = base(&env);
    assert_eq!(after.next_burn_id, 4);
    assert_eq!(after.window, None);
    assert_eq!(after.last_scraped_block, window.to_block);
    assert_eq!(after.failed_ticks, 0);
    assert_eq!(
        after.supply.map(|s| (s.block, s.total_supply)),
        Some((window.to_block, Nat::from(6 * ONE)))
    );

    // 6. The other three burns are minted once each
    env.pic.advance_time(Duration::from_secs(61));
    tick_until(&env, "the last mint", || {
        matches!(inbound_status(&env, 3), InboundStatus::Minted { .. })
    });
    for burn_id in 1..4 {
        assert!(matches!(
            inbound_status(&env, burn_id),
            InboundStatus::Minted { icp_block_index } if icp_block_index > burn_block
        ));
    }
    // burn 0 minted once (before the upgrade), the burn out once, burns 1 to 3 once each
    assert_eq!(balance(&env), balance_before_burn - ONE + 3 * ONE);
    let done = get_bridge_status(&env.pic, env.controller, gldt_swap, &());
    // 10 out to Base, 1 out to Ethereum, 4 back
    assert_eq!(done.bridged_out, Nat::from(7 * ONE));
    assert_eq!(done.out_pending, Nat::from(0u8));
    assert!(!done.supply_guard.holding);
}
