//! What gldt_swap signs, checked by the real contract. `write_canister_fixture` writes
//! `evm/gldt-bridge/test/fixtures/canister_signed.json` with the canister's two test key
//! addresses, a claim voucher and a signed `SetMinBurnToIcp(200_000_000)` admin action, for
//! anvil's chain id 31337 and the token address `0x…B1D6E`. `CanisterFixture.t.sol` deploys the
//! token at that address with those signers, claims the voucher and runs the action through
//! `execute`.

use crate::client::gldt_swap::{
    bridge_sns_action, get_bridge_admin_action, get_bridge_transfer_out,
};
use crate::gldt_swap_suite::bridge::setup::{
    anvil_chain_config, bridge_out, start_chains_with_tokens, wait_for_signers, BridgeEnvBuilder,
    ANVIL_CHAIN_ID,
};
use candid::Nat;
use gldt_swap_common::bridge::{
    BridgeSnsAction, EvmAdminAction, EvmAdminRequest, EvmChain, OutboundStatus,
};
use serde_json::json;
use std::path::PathBuf;
use std::time::Duration;

/// The token address of the fixture, as in the shared EIP-712 vectors.
pub const FIXTURE_TOKEN: &str = "0x00000000000000000000000000000000000B1D6E";
/// 12.5 GLDT.
const VOUCHER_AMOUNT: u64 = 1_250_000_000;
/// 2 GLDT.
const MIN_BURN_TO_ICP: u64 = 200_000_000;

fn fixture_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../evm/gldt-bridge/test/fixtures/canister_signed.json")
}

#[test]
fn write_canister_fixture() {
    let mut env = BridgeEnvBuilder::new()
        .with_chains(vec![anvil_chain_config(EvmChain::Ethereum, FIXTURE_TOKEN)])
        .build();
    env.evm = start_chains_with_tokens(
        &env.pic,
        env.controller,
        env.gldt_swap_canister_id,
        &[FIXTURE_TOKEN],
    );
    let (claims, admin) = wait_for_signers(&env);

    // a voucher for 12.5 GLDT to anvil's account 1
    let transfer = bridge_out(
        &env.pic,
        env.gldt_ledger_canister_id,
        env.gldt_swap_canister_id,
        env.user,
        EvmChain::Ethereum,
        VOUCHER_AMOUNT,
    );
    let mut voucher = None;
    for _ in 0..10 {
        let status =
            get_bridge_transfer_out(&env.pic, env.user, env.gldt_swap_canister_id, &transfer.id)
                .expect("the transfer is stored")
                .status;
        if let OutboundStatus::Signed(signed) = status {
            voucher = Some(signed);
            break;
        }
        env.pic.advance_time(Duration::from_secs(61));
        env.tick_n(10);
    }
    let voucher = voucher.expect("the voucher was not signed");
    assert_eq!(voucher.chain_id, ANVIL_CHAIN_ID);
    assert_eq!(voucher.token.to_lowercase(), FIXTURE_TOKEN.to_lowercase());
    assert_eq!(voucher.amount, Nat::from(VOUCHER_AMOUNT));

    // an admin action, as an SNS proposal would ask for it
    bridge_sns_action(
        &env.pic,
        env.sns_governance,
        env.gldt_swap_canister_id,
        &BridgeSnsAction::SignEvmAdmin(vec![EvmAdminRequest {
            chain: EvmChain::Ethereum,
            actions: vec![EvmAdminAction::SetMinBurnToIcp {
                amount: Nat::from(MIN_BURN_TO_ICP),
            }],
            valid_for_secs: None,
        }]),
    )
    .unwrap_or_else(|e| panic!("bridge_sns_action failed: {e}"));
    let action = get_bridge_admin_action(&env.pic, env.user, env.gldt_swap_canister_id, &0)
        .expect("admin action 0 is stored");
    assert_eq!(action.chain_id, ANVIL_CHAIN_ID);
    assert_eq!(action.token.to_lowercase(), FIXTURE_TOKEN.to_lowercase());
    assert_eq!(action.calls.len(), 1);

    let fixture = json!({
        "note": "Written by the PocketIC test write_canister_fixture (backend/integration_tests/src/gldt_swap_suite/bridge/fixtures.rs). Checked by test/CanisterFixture.t.sol. Do not edit by hand.",
        "chainId": ANVIL_CHAIN_ID,
        "token": voucher.token,
        "claimsSigner": claims,
        "adminSigner": admin,
        "voucher": {
            "icpBurnIndex": voucher.icp_burn_index,
            "recipient": voucher.recipient,
            "amount": voucher.amount.0.to_string(),
            "signature": voucher.signature,
        },
        "adminAction": {
            "description": action.description,
            "nonce": action.nonce,
            "deadline": action.deadline,
            "calls": action.calls.iter().map(|call| json!({
                "target": call.target,
                "data": format!("0x{}", hex::encode(&call.data)),
            })).collect::<Vec<_>>(),
            "signature": action.signature,
        },
    });
    let path = fixture_path();
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    let text = serde_json::to_string_pretty(&fixture).unwrap() + "\n";
    std::fs::write(&path, text).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
}
