//! `bridge_sns_action` and its validator (spec 8.9 and 8.11): ORIGYN SNS governance, stood in
//! for by `BridgeEnv::sns_governance`, gets admin actions signed with the canister's admin key,
//! sets the ICP pause flags and resolves transfers the bridge can't settle by itself.

use super::outbound::{address_word, keccak, recover, word};
use crate::client::gldt_swap::{
    bridge_sns_action, bridge_to_evm, get_bridge_admin_action, get_bridge_admin_actions,
    get_bridge_status, get_bridge_transfer_in, get_bridge_transfer_out, validate_bridge_sns_action,
};
use crate::client::icrc1_icrc2_token::{icrc1_balance_of, icrc2_approve};
use crate::client::pocket::{start_canister, stop_canister};
use crate::gldt_swap_suite::bridge::outcalls::serve_outcalls;
use crate::gldt_swap_suite::bridge::setup::{
    bridge_out, setup_bridge_env, start_all_chains, wait_for_signers, BridgeEnv, BridgeEnvBuilder,
    FAKE_BASE_TOKEN, FAKE_ETHEREUM_TOKEN,
};
use candid::{Nat, Principal};
use gldt_swap_common::bridge::{
    BridgeSnsAction, BridgeStatus, BridgeToEvmArgs, EvmAdminAction, EvmAdminRequest, EvmCall,
    EvmChain, InboundStatus, OutboundStatus, ResolveAction, SignedEvmAdminAction,
};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use std::time::Duration;

/// 1 GLDT.
const ONE: u128 = 100_000_000;
const DAY_SECS: u64 = 24 * 60 * 60;
/// Past the ledger's 24 hour deduplication window, so a retry is `TooOld`.
const PAST_DEDUP_WINDOW: Duration = Duration::from_secs(25 * 60 * 60);

fn status(env: &BridgeEnv) -> BridgeStatus {
    get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &())
}

fn e8s(n: &Nat) -> u128 {
    u128::try_from(n.0.clone()).unwrap()
}

fn balance(env: &BridgeEnv, owner: Principal) -> u128 {
    e8s(&icrc1_balance_of(
        &env.pic,
        Principal::anonymous(),
        env.gldt_ledger_canister_id,
        &Account::from(owner),
    ))
}

fn sns(env: &BridgeEnv, action: &BridgeSnsAction) {
    bridge_sns_action(
        &env.pic,
        env.sns_governance,
        env.gldt_swap_canister_id,
        action,
    )
    .unwrap_or_else(|e| panic!("bridge_sns_action failed: {e}"));
}

fn validate(env: &BridgeEnv, action: &BridgeSnsAction) -> Result<String, String> {
    validate_bridge_sns_action(
        &env.pic,
        env.sns_governance,
        env.gldt_swap_canister_id,
        action,
    )
}

/// Lets 3 minutes pass, so each chain runs one scrape tick, and answers its outcalls.
fn scrape_round(env: &BridgeEnv) {
    env.pic.advance_time(Duration::from_secs(180));
    serve_outcalls(&env.pic, |r| env.evm.answer(r));
}

/// Lets the ledger's deduplication window pass, and answers the scrape ticks the jump starts
/// right away: PocketIC times out an outcall left pending while time moves on, and the tick
/// that waits for it keeps the chain's job guard, so the next round would scrape nothing.
fn pass_dedup_window(env: &BridgeEnv) {
    env.pic.advance_time(PAST_DEDUP_WINDOW);
    serve_outcalls(&env.pic, |r| env.evm.answer(r));
}

/// Lets a minute pass, so `bridge_process` runs again, and lets its calls finish.
fn process(env: &BridgeEnv) {
    env.pic.advance_time(Duration::from_secs(61));
    env.tick_n(10);
}

fn inbound_status(env: &BridgeEnv, chain: EvmChain, burn_id: u64) -> InboundStatus {
    get_bridge_transfer_in(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &(chain, burn_id),
    )
    .unwrap_or_else(|| panic!("burn {burn_id} on {chain:?} is not saved"))
    .status
}

fn outbound_status(env: &BridgeEnv, id: u64) -> OutboundStatus {
    get_bridge_transfer_out(&env.pic, env.user, env.gldt_swap_canister_id, &id)
        .unwrap_or_else(|| panic!("no outbound {id}"))
        .status
}

/// The `execute` digest the token checks, built by hand from the contract's type strings and
/// the `("Gold Token", "1", chainId, token)` domain, so the canister's own code is not reused.
fn execute_digest(action: &SignedEvmAdminAction) -> [u8; 32] {
    let domain = keccak(
        &[
            keccak(
                b"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
            ),
            keccak(b"Gold Token"),
            keccak(b"1"),
            word(&action.chain_id.to_be_bytes()),
            address_word(&action.token),
        ]
        .concat(),
    );
    let call_type = keccak(b"Call(address target,bytes data)");
    let calls: Vec<u8> = action
        .calls
        .iter()
        .flat_map(|call| {
            keccak(&[call_type, address_word(&call.target), keccak(&call.data)].concat())
        })
        .collect();
    let execute = keccak(
        &[
            keccak(
                b"Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)",
            ),
            keccak(&calls),
            word(&action.nonce.to_be_bytes()),
            word(&action.deadline.to_be_bytes()),
        ]
        .concat(),
    );
    keccak(&[&[0x19u8, 0x01][..], &domain, &execute].concat())
}

#[test]
fn sign_set_min_burn_to_icp_and_recover_admin_address() {
    let env = setup_bridge_env();
    let (_, admin) = wait_for_signers(&env);
    let action = BridgeSnsAction::SignEvmAdmin(vec![EvmAdminRequest {
        chain: EvmChain::Base,
        actions: vec![EvmAdminAction::SetMinBurnToIcp {
            amount: Nat::from(200_000_000u64),
        }],
        valid_for_secs: None,
    }]);

    let text = validate(&env, &action).expect("the action is valid");
    assert!(text.starts_with("Base (8453), GLDT "), "{text}");
    assert!(
        text.contains("Set the smallest burnToIcp to 200000000 e8s (2 GLDT)"),
        "{text}"
    );
    assert!(
        text.ends_with("Valid for 7 days after execution."),
        "{text}"
    );

    let now_secs = env.pic.get_time().as_nanos_since_unix_epoch() / 1_000_000_000;
    sns(&env, &action);

    let actions =
        get_bridge_admin_actions(&env.pic, env.user, env.gldt_swap_canister_id, &(None, 10));
    assert_eq!(actions.len(), 1);
    let signed = get_bridge_admin_action(&env.pic, env.user, env.gldt_swap_canister_id, &0)
        .expect("admin action 0 is stored");
    assert_eq!(actions[0], signed);
    assert_eq!((signed.id, signed.nonce), (0, 0));
    assert_eq!(signed.chain, EvmChain::Base);
    assert_eq!(signed.chain_id, 8453);
    assert_eq!(signed.token.to_lowercase(), FAKE_BASE_TOKEN.to_lowercase());
    assert_eq!(signed.description, text);

    // setMinBurnToIcp(200000000) on the token, built by hand
    let mut data = keccak(b"setMinBurnToIcp(uint256)")[..4].to_vec();
    data.extend_from_slice(&word(&200_000_000u64.to_be_bytes()));
    assert_eq!(
        signed.calls,
        vec![EvmCall {
            target: signed.token.clone(),
            data,
        }]
    );
    assert!(
        signed.deadline >= now_secs + 7 * DAY_SECS
            && signed.deadline <= now_secs + 7 * DAY_SECS + 60,
        "deadline {} for now {now_secs}",
        signed.deadline
    );

    // the admin key signed exactly what `execute` checks
    assert_eq!(
        recover(execute_digest(&signed), &signed.signature),
        admin.to_lowercase()
    );

    // the next action takes the next nonce
    sns(
        &env,
        &BridgeSnsAction::SignEvmAdmin(vec![EvmAdminRequest {
            chain: EvmChain::Ethereum,
            actions: vec![EvmAdminAction::CancelNonce { nonce: 0 }],
            valid_for_secs: Some(DAY_SECS),
        }]),
    );
    let ids: Vec<u64> =
        get_bridge_admin_actions(&env.pic, env.user, env.gldt_swap_canister_id, &(None, 10))
            .iter()
            .map(|a| a.nonce)
            .collect();
    assert_eq!(ids, vec![1, 0]);
    let cancel =
        get_bridge_admin_action(&env.pic, env.user, env.gldt_swap_canister_id, &1).unwrap();
    assert_eq!(cancel.chain_id, 1);
    assert_eq!(
        recover(execute_digest(&cancel), &cancel.signature),
        admin.to_lowercase()
    );
}

/// Every resolve action that needs a ledger outage longer than its deduplication window:
/// the outbound pair, and an inbound mint retried and one marked minted.
#[test]
fn resolve_actions_update_counters() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    let gldt_swap = env.gldt_swap_canister_id;
    let user = env.user;

    // 10 GLDT out to Base and claimed there, so inbound mints can follow
    bridge_out(
        &env.pic,
        env.gldt_ledger_canister_id,
        gldt_swap,
        user,
        EvmChain::Base,
        (10 * ONE) as u64,
    );
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply = 10 * ONE;
    env.evm.advance(5);
    assert_eq!(status(&env).bridged_out, Nat::from(10 * ONE));

    // first outage: two outbound burns and one inbound mint end up past the ledger's window
    let approved = icrc2_approve(
        &env.pic,
        user,
        env.gldt_ledger_canister_id,
        &ApproveArgs {
            from_subaccount: None,
            spender: Account::from(gldt_swap),
            amount: Nat::from(2 * ONE),
            expected_allowance: None,
            expires_at: None,
            fee: None,
            memo: None,
            created_at_time: None,
        },
    );
    assert!(matches!(approved, icrc2_approve::Response::Ok(_)));
    env.evm.burn(FAKE_BASE_TOKEN, user, ONE);
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply -= ONE;
    env.evm.advance(20);

    stop_canister(&env.pic, env.controller, env.gldt_ledger_canister_id);
    let mut out_ids = Vec::new();
    for _ in 0..2 {
        let transfer = bridge_to_evm(
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
        assert_eq!(transfer.status, OutboundStatus::BurnUnknown);
        out_ids.push(transfer.id);
    }
    scrape_round(&env);
    process(&env);
    assert_eq!(
        inbound_status(&env, EvmChain::Base, 0),
        InboundStatus::MintUnknown
    );
    pass_dedup_window(&env);
    start_canister(&env.pic, env.controller, env.gldt_ledger_canister_id);
    process(&env);
    assert!(matches!(
        inbound_status(&env, EvmChain::Base, 0),
        InboundStatus::NeedsManualCheck(_)
    ));
    for id in &out_ids {
        assert!(matches!(
            outbound_status(&env, *id),
            OutboundStatus::NeedsManualCheck(_)
        ));
    }

    // second outage: one more inbound mint past the window
    env.evm.burn(FAKE_BASE_TOKEN, user, ONE);
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply -= ONE;
    env.evm.advance(20);
    stop_canister(&env.pic, env.controller, env.gldt_ledger_canister_id);
    scrape_round(&env);
    process(&env);
    assert_eq!(
        inbound_status(&env, EvmChain::Base, 1),
        InboundStatus::MintUnknown
    );
    pass_dedup_window(&env);
    start_canister(&env.pic, env.controller, env.gldt_ledger_canister_id);
    process(&env);
    assert!(matches!(
        inbound_status(&env, EvmChain::Base, 1),
        InboundStatus::NeedsManualCheck(_)
    ));

    let before = status(&env);
    assert_eq!(before.bridged_out, Nat::from(10 * ONE));
    assert_eq!(before.out_pending, Nat::from(2 * ONE));
    assert_eq!(before.queue.needs_manual_check, 2);
    let balance_before = balance(&env, user);

    // a person found burn 1's mint and outbound 0's burn, and confirmed the others never happened
    let resolve = BridgeSnsAction::Resolve(vec![
        ResolveAction::InboundRetry {
            token: None,
            chain: EvmChain::Base,
            burn_id: 0,
        },
        ResolveAction::InboundMarkMinted {
            token: None,
            chain: EvmChain::Base,
            burn_id: 1,
            icp_block_index: 999,
        },
        ResolveAction::OutboundMarkBurned {
            id: out_ids[0],
            icp_burn_index: 998,
        },
        ResolveAction::OutboundMarkFailed { id: out_ids[1] },
    ]);
    let text = validate(&env, &resolve).expect("the resolve actions are valid");
    assert!(text.starts_with("Resolve 4 bridge transfer(s):"), "{text}");
    sns(&env, &resolve);

    assert_eq!(
        inbound_status(&env, EvmChain::Base, 1),
        InboundStatus::Minted {
            icp_block_index: 999
        }
    );
    assert_eq!(
        outbound_status(&env, out_ids[0]),
        OutboundStatus::Burned {
            icp_burn_index: 998
        }
    );
    assert!(matches!(
        outbound_status(&env, out_ids[1]),
        OutboundStatus::Failed(_)
    ));
    let after = status(&env);
    // 10 - 1 (burn 1 marked minted) + 1 (outbound 0 marked burned)
    assert_eq!(after.bridged_out, Nat::from(10 * ONE));
    assert_eq!(after.out_pending, Nat::from(0u8));
    assert_eq!(after.queue.needs_manual_check, 0);
    assert_eq!(after.queue.queued, 1);

    // the processor mints the retried burn with a new timestamp and signs the burned voucher
    process(&env);
    process(&env);
    assert!(matches!(
        inbound_status(&env, EvmChain::Base, 0),
        InboundStatus::Minted { .. }
    ));
    assert_eq!(balance(&env, user), balance_before + ONE);
    assert!(matches!(
        outbound_status(&env, out_ids[0]),
        OutboundStatus::Signed(_)
    ));
    let done = status(&env);
    assert_eq!(done.bridged_out, Nat::from(9 * ONE));
    assert_eq!(done.supply_guard.evm_side, Nat::from(8 * ONE));

    // resolving a settled transfer again fails, and changes nothing
    assert!(validate(&env, &resolve).is_err());
    assert!(bridge_sns_action(&env.pic, env.sns_governance, gldt_swap, &resolve).is_err());
    assert_eq!(status(&env).bridged_out, done.bridged_out);
}

/// A forged burn the guard holds is rejected, and a quarantined burn is minted elsewhere.
#[test]
fn reject_and_mint_to_resolve_held_and_quarantined_burns() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    let gldt_swap = env.gldt_swap_canister_id;
    let user = env.user;
    bridge_out(
        &env.pic,
        env.gldt_ledger_canister_id,
        gldt_swap,
        user,
        EvmChain::Base,
        (10 * ONE) as u64,
    );
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply = 10 * ONE;

    // a forged 20 GLDT burn on Ethereum, above the 10 bridged out, and an honest 2 GLDT burn on
    // Base to the ledger's minting account
    env.evm.burn(FAKE_ETHEREUM_TOKEN, user, 20 * ONE);
    env.evm.burn(FAKE_BASE_TOKEN, gldt_swap, 2 * ONE);
    env.evm.token_mut(FAKE_BASE_TOKEN).total_supply = 8 * ONE;
    env.evm.advance(20);
    scrape_round(&env);
    process(&env);
    assert_eq!(
        inbound_status(&env, EvmChain::Ethereum, 0),
        InboundStatus::Queued
    );
    assert_eq!(
        inbound_status(&env, EvmChain::Base, 0),
        InboundStatus::Queued
    );
    assert_eq!(status(&env).supply_guard.evm_side, Nat::from(30 * ONE));

    let reject = BridgeSnsAction::Resolve(vec![ResolveAction::InboundReject {
        token: None,
        chain: EvmChain::Ethereum,
        burn_id: 0,
        reason: "forged: no matching LayerZero send".to_string(),
    }]);
    validate(&env, &reject).expect("the rejection is valid");
    sns(&env, &reject);
    assert_eq!(
        inbound_status(&env, EvmChain::Ethereum, 0),
        InboundStatus::Rejected("forged: no matching LayerZero send".to_string())
    );
    let after_reject = status(&env);
    assert_eq!(after_reject.bridged_out, Nat::from(10 * ONE));
    assert_eq!(after_reject.supply_guard.evm_side, Nat::from(10 * ONE));

    // the queue moves on: the Base burn would mint to the minting account, so it is quarantined
    process(&env);
    assert!(matches!(
        inbound_status(&env, EvmChain::Base, 0),
        InboundStatus::Quarantined(_)
    ));
    let balance_before = balance(&env, user);

    let mint_to = BridgeSnsAction::Resolve(vec![ResolveAction::InboundMintTo {
        token: None,
        chain: EvmChain::Base,
        burn_id: 0,
        to: Account::from(user),
    }]);
    validate(&env, &mint_to).expect("the new account is valid");
    sns(&env, &mint_to);
    process(&env);
    assert!(matches!(
        inbound_status(&env, EvmChain::Base, 0),
        InboundStatus::Minted { .. }
    ));
    assert_eq!(balance(&env, user), balance_before + 2 * ONE);
    let done = status(&env);
    assert_eq!(done.bridged_out, Nat::from(8 * ONE));
    assert!(!done.supply_guard.holding);
}

#[test]
fn stranger_cannot_call_bridge_sns_action() {
    let env = setup_bridge_env();
    let gldt_swap = env.gldt_swap_canister_id;
    let pause = BridgeSnsAction::SetIcpPaused {
        inbound: Some(true),
        outbound: Some(true),
    };

    // an authorized principal, a user and the anonymous principal are all refused, but each
    // can preview the voter text, which changes nothing
    for stranger in [env.controller, env.user, Principal::anonymous()] {
        assert!(bridge_sns_action(&env.pic, stranger, gldt_swap, &pause).is_err());
        let preview = validate_bridge_sns_action(&env.pic, stranger, gldt_swap, &pause)
            .expect("anyone can preview the text");
        assert!(preview.contains("inbound mints"), "{preview}");
    }
    let unchanged = status(&env);
    assert!(!unchanged.paused_in && !unchanged.paused_out);

    // SNS governance pauses and unpauses
    sns(&env, &pause);
    let paused = status(&env);
    assert!(paused.paused_in && paused.paused_out);
    sns(
        &env,
        &BridgeSnsAction::SetIcpPaused {
            inbound: Some(false),
            outbound: None,
        },
    );
    let one = status(&env);
    assert!(!one.paused_in && one.paused_out);

    // an action that fails its checks traps, also for governance
    assert!(bridge_sns_action(
        &env.pic,
        env.sns_governance,
        gldt_swap,
        &BridgeSnsAction::SetIcpPaused {
            inbound: None,
            outbound: None,
        },
    )
    .is_err());

    // without a bridge config nobody may call it
    let unconfigured = BridgeEnvBuilder::new().without_bridge_at_init().build();
    assert!(bridge_sns_action(
        &unconfigured.pic,
        unconfigured.sns_governance,
        unconfigured.gldt_swap_canister_id,
        &pause,
    )
    .is_err());
}
