//! ICP to EVM: `bridge_to_evm` burns on the GLDT ledger and signs a claim voucher.

use crate::client::gldt_swap::{
    bridge_to_evm, get_bridge_status, get_bridge_transfer_out, get_bridge_transfers_out_by_account,
    icrc21_canister_call_consent_message,
};
use crate::client::icrc1_icrc2_token::{icrc1_balance_of, icrc1_total_supply, icrc2_approve};
use crate::client::pocket::{start_canister, stop_canister};
use crate::gldt_swap_suite::bridge::setup::{
    setup_bridge_env, start_all_chains, wait_for_signers, BridgeEnv, FAKE_BASE_TOKEN,
};
use candid::{Encode, Nat, Principal};
use gldt_swap_common::bridge::{
    BridgeToEvmArgs, EvmChain, EvmVoucher, OutboundCounts, OutboundStatus, OutboundTransfer,
};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use icrc_ledger_types::icrc21::requests::{
    ConsentMessageMetadata, ConsentMessageRequest, ConsentMessageSpec,
};
use icrc_ledger_types::icrc21::responses::ConsentMessage;
use k256::ecdsa::{RecoveryId, Signature, VerifyingKey};
use std::time::Duration;

/// Anvil's public account 1.
const RECIPIENT: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
/// 12.5 GLDT.
const AMOUNT: u64 = 1_250_000_000;

fn bridge_args() -> BridgeToEvmArgs {
    BridgeToEvmArgs {
        chain: EvmChain::Base,
        recipient: RECIPIENT.to_string(),
        amount: Nat::from(AMOUNT),
        from_subaccount: None,
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

/// `owner` lets gldt_swap burn `amount` (a burn charges no fee).
fn approve(env: &BridgeEnv, owner: Principal, amount: u64) {
    let result = icrc2_approve(
        &env.pic,
        owner,
        env.gldt_ledger_canister_id,
        &ApproveArgs {
            from_subaccount: None,
            spender: Account::from(env.gldt_swap_canister_id),
            amount: Nat::from(amount),
            expected_allowance: None,
            expires_at: None,
            fee: None,
            memo: None,
            created_at_time: None,
        },
    );
    assert!(
        matches!(result, icrc2_approve::Response::Ok(_)),
        "{result:?}"
    );
}

fn transfer_out(env: &BridgeEnv, id: u64) -> OutboundTransfer {
    get_bridge_transfer_out(&env.pic, env.user, env.gldt_swap_canister_id, &id)
        .unwrap_or_else(|| panic!("no outbound {id}"))
}

/// Lets `bridge_process` run until the transfer is `Signed`. Signing finishes in the call
/// itself or, if it failed there, in a later run.
fn wait_for_signed(env: &BridgeEnv, id: u64) -> OutboundTransfer {
    for _ in 0..10 {
        let transfer = transfer_out(env, id);
        if matches!(transfer.status, OutboundStatus::Signed(_)) {
            return transfer;
        }
        env.pic.advance_time(Duration::from_secs(61));
        env.tick_n(10);
    }
    panic!(
        "outbound {id} was not signed: {:?}",
        transfer_out(env, id).status
    );
}

pub(super) fn keccak(data: &[u8]) -> [u8; 32] {
    alloy_primitives::keccak256(data).0
}

pub(super) fn word(be: &[u8]) -> [u8; 32] {
    let mut word = [0u8; 32];
    word[32 - be.len()..].copy_from_slice(be);
    word
}

pub(super) fn address_word(text: &str) -> [u8; 32] {
    let bytes = hex::decode(text.strip_prefix("0x").unwrap()).unwrap();
    assert_eq!(bytes.len(), 20, "{text}");
    word(&bytes)
}

/// The digest `claimFromIcp` checks, built by hand from the contract's type strings and the
/// `("Gold Token", "1", chainId, token)` domain, so the canister's own code is not reused.
pub(super) fn claim_digest(voucher: &EvmVoucher) -> [u8; 32] {
    let domain_type = keccak(
        b"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
    );
    let domain = keccak(
        &[
            domain_type,
            keccak(b"Gold Token"),
            keccak(b"1"),
            word(&voucher.chain_id.to_be_bytes()),
            address_word(&voucher.token),
        ]
        .concat(),
    );
    let claim_type = keccak(b"Claim(uint64 icpBurnIndex,address recipient,uint256 amount)");
    let amount = e8s(voucher.amount.clone());
    let claim = keccak(
        &[
            claim_type,
            word(&voucher.icp_burn_index.to_be_bytes()),
            address_word(&voucher.recipient),
            word(&amount.to_be_bytes()),
        ]
        .concat(),
    );
    keccak(&[&[0x19u8, 0x01][..], &domain, &claim].concat())
}

/// The lower case address `ecrecover` gives, after checking what OpenZeppelin's
/// `ECDSA.recover` requires: 65 bytes, `v` 27 or 28, and a low `s`.
pub(super) fn recover(digest: [u8; 32], signature: &str) -> String {
    let bytes = hex::decode(signature.strip_prefix("0x").unwrap()).unwrap();
    assert_eq!(bytes.len(), 65);
    let v = bytes[64];
    assert!(v == 27 || v == 28, "v is {v}");
    let sig = Signature::from_slice(&bytes[..64]).unwrap();
    assert!(sig.normalize_s().is_none(), "s is high");
    let key =
        VerifyingKey::recover_from_prehash(&digest, &sig, RecoveryId::new(v == 28, false)).unwrap();
    let hash = keccak(&key.to_encoded_point(false).as_bytes()[1..]);
    format!("0x{}", hex::encode(&hash[12..]))
}

#[test]
fn bridge_to_evm_burns_and_signs_voucher() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    let (claims, _) = wait_for_signers(&env);
    approve(&env, env.user, AMOUNT);
    let balance_before = balance(&env, env.user);
    let supply_before = total_supply(&env);

    let transfer = bridge_to_evm(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &bridge_args(),
    )
    .expect("bridge_to_evm");
    assert_eq!(transfer.from, Account::from(env.user));
    assert_eq!(transfer.chain, EvmChain::Base);
    assert_eq!(transfer.recipient, RECIPIENT);
    assert_eq!(transfer.amount, AMOUNT);

    let transfer = wait_for_signed(&env, transfer.id);
    let OutboundStatus::Signed(voucher) = &transfer.status else {
        unreachable!()
    };

    // burned once: no fee on a burn
    assert_eq!(balance(&env, env.user), balance_before - AMOUNT as u128);
    assert_eq!(total_supply(&env), supply_before - AMOUNT as u128);

    assert_eq!(voucher.chain_id, 8453);
    assert_eq!(voucher.token.to_lowercase(), FAKE_BASE_TOKEN.to_lowercase());
    assert_eq!(voucher.recipient, RECIPIENT);
    assert_eq!(voucher.amount, AMOUNT);
    assert_eq!(voucher.signature.len(), 2 + 65 * 2);
    assert_eq!(
        recover(claim_digest(voucher), &voucher.signature),
        claims.to_lowercase()
    );

    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, AMOUNT);
    assert_eq!(status.out_pending, 0u64);

    assert_eq!(
        get_bridge_transfers_out_by_account(
            &env.pic,
            env.user,
            env.gldt_swap_canister_id,
            &(Account::from(env.user), None, 10),
        ),
        vec![transfer]
    );
}

#[test]
fn retry_after_ledger_unavailable_does_not_double_burn() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);
    wait_for_signers(&env);
    approve(&env, env.user, AMOUNT);
    let balance_before = balance(&env, env.user);
    let supply_before = total_supply(&env);

    // a stopped ledger answers with a reject, so the outcome is unknown
    stop_canister(&env.pic, env.controller, env.gldt_ledger_canister_id);
    let transfer = bridge_to_evm(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &bridge_args(),
    )
    .expect("an unknown outcome is not an error");
    assert_eq!(transfer.status, OutboundStatus::BurnUnknown);
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.out_pending, AMOUNT);
    assert_eq!(status.bridged_out, 0u64);
    assert_eq!(status.outbound.burn_unknown, 1);

    // while the ledger is down the processor keeps retrying and keeps the amount reserved
    env.pic.advance_time(Duration::from_secs(61));
    env.tick_n(10);
    assert_eq!(
        transfer_out(&env, transfer.id).status,
        OutboundStatus::BurnUnknown
    );

    start_canister(&env.pic, env.controller, env.gldt_ledger_canister_id);
    let signed = wait_for_signed(&env, transfer.id);

    assert_eq!(balance(&env, env.user), balance_before - AMOUNT as u128);
    assert_eq!(total_supply(&env), supply_before - AMOUNT as u128);
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, AMOUNT);
    assert_eq!(status.out_pending, 0u64);

    // later processor runs burn nothing more and keep the voucher
    for _ in 0..3 {
        env.pic.advance_time(Duration::from_secs(61));
        env.tick_n(10);
    }
    assert_eq!(balance(&env, env.user), balance_before - AMOUNT as u128);
    assert_eq!(total_supply(&env), supply_before - AMOUNT as u128);
    assert_eq!(transfer_out(&env, transfer.id), signed);
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, AMOUNT);
    assert_eq!(status.out_pending, 0u64);
    assert_eq!(status.outbound, OutboundCounts::default());
}

#[test]
fn icrc21_message_for_bridge_to_evm() {
    let mut env = setup_bridge_env();
    start_all_chains(&mut env);

    let request = ConsentMessageRequest {
        method: "bridge_to_evm".to_string(),
        arg: Encode!(&bridge_args()).unwrap(),
        user_preferences: ConsentMessageSpec {
            metadata: ConsentMessageMetadata {
                language: "en".to_string(),
                utc_offset_minutes: None,
            },
            device_spec: None,
        },
    };
    // wallets ask before the user signs in, so anonymous works
    let info = icrc21_canister_call_consent_message(
        &env.pic,
        Principal::anonymous(),
        env.gldt_swap_canister_id,
        &request,
    )
    .expect("consent message");
    let ConsentMessage::GenericDisplayMessage(text) = info.consent_message else {
        panic!("expected a generic display message");
    };
    assert!(
        text.contains("Burn 12.5 GLDT on ICP to receive 12.5 GLDT at 0x7099\u{2026}79C8 on Base"),
        "{text}"
    );
    assert!(text.contains(RECIPIENT), "{text}");

    // asking changes nothing
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.out_pending, 0u64);
    assert_eq!(status.bridged_out, 0u64);
}
