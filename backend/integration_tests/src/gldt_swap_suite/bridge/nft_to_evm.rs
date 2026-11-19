//! Gold NFTs straight to Ethereum or Base: `swap_nft_for_evm` takes the user's NFTs and signs a
//! claim voucher backed by them. Nothing is minted or burned on ICP.

use crate::client::gldt_swap::{
    bridge_pause, bridge_sns_action, get_active_swap_ids_by_user, get_bridge_status,
    get_bridge_transfer_out, get_bridge_transfers_out_by_account, get_failed_swaps_by_user,
    http_request, icrc3_get_blocks, manual_gldt_supply_balance, swap_nft_for_evm,
};
use crate::client::icrc1_icrc2_token::icrc1_total_supply;
use crate::client::origyn_nft::icrc7_owner_of;
use crate::gldt_swap_suite::bridge::outbound::{claim_digest, recover};
use crate::gldt_swap_suite::bridge::setup::{
    start_all_chains, wait_for_signers, BridgeEnv, BridgeEnvBuilder, FAKE_ETHEREUM_TOKEN,
    NFT_VALUE_E8S,
};
use candid::{Nat, Principal};
use gldt_swap_api_canister::swap_nft_for_evm::{SwapNftForEvmArgs, SwapNftForEvmError};
use gldt_swap_common::bridge::{
    BridgeError, BridgePauseArgs, BridgeSnsAction, EvmChain, OutboundCounts, OutboundStatus,
};
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap::SwapStatus;
use icrc_ledger_types::icrc::generic_value::ICRC3Value;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc3::blocks::GetBlocksRequest;
use serde_bytes::ByteBuf;

/// Anvil's public account 1.
const RECIPIENT: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

fn args(nft: &Nft, chain: EvmChain, recipient: &str) -> SwapNftForEvmArgs {
    SwapNftForEvmArgs {
        nfts: [nft.clone()].into_iter().collect(),
        chain,
        recipient: recipient.to_string(),
    }
}

fn total_supply(env: &BridgeEnv) -> Nat {
    icrc1_total_supply(
        &env.pic,
        Principal::anonymous(),
        env.gldt_ledger_canister_id,
        &(),
    )
}

fn owner(env: &BridgeEnv, nft: &Nft) -> Option<Account> {
    icrc7_owner_of(
        &env.pic,
        env.controller,
        nft.canister_id,
        &vec![nft.id.clone()],
    )
    .into_iter()
    .next()
    .flatten()
}

/// The `status` of swap `index` in gldt_swap's ICRC-3 log, if the log has it.
fn logged_swap_status(env: &BridgeEnv, index: &Nat) -> Option<String> {
    fn find(value: &ICRC3Value, index: &Nat) -> Option<String> {
        match value {
            ICRC3Value::Map(map) => {
                let is_swap = map.get("index") == Some(&ICRC3Value::Nat(index.clone()))
                    && map.get("swap_type") == Some(&ICRC3Value::Text("Forward".to_string()));
                if is_swap {
                    if let Some(ICRC3Value::Text(status)) = map.get("status") {
                        return Some(status.clone());
                    }
                }
                map.values().find_map(|v| find(v, index))
            }
            ICRC3Value::Array(values) => values.iter().find_map(|v| find(v, index)),
            _ => None,
        }
    }
    let blocks = icrc3_get_blocks(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &vec![GetBlocksRequest {
            start: Nat::from(0u8),
            length: Nat::from(100u8),
        }],
    );
    blocks.blocks.iter().find_map(|b| find(&b.block, index))
}

/// gldt_swap's log lines, as `http_request` serves them at `/logs`.
fn canister_logs(env: &BridgeEnv) -> String {
    let response = http_request(
        &env.pic,
        env.controller,
        env.gldt_swap_canister_id,
        &types::HttpRequest {
            method: "GET".to_string(),
            url: "/logs".to_string(),
            headers: vec![],
            body: ByteBuf::new(),
        },
    );
    String::from_utf8(response.body.into_vec()).unwrap()
}

#[test]
fn swap_nft_for_evm_locks_the_nft_and_signs_a_voucher() {
    let mut env = BridgeEnvBuilder::new().with_nft_collection(1).build();
    start_all_chains(&mut env);
    let (claims, _) = wait_for_signers(&env);
    let nft = env.user_nfts[0].clone();
    assert_eq!(env.nft_collection, Some(nft.canister_id));
    assert_eq!(owner(&env, &nft), Some(Account::from(env.user)));
    let supply_before = total_supply(&env);

    // lower case is accepted and stored as EIP-55
    let reply = swap_nft_for_evm(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &args(&nft, EvmChain::Ethereum, &RECIPIENT.to_lowercase()),
    )
    .expect("swap_nft_for_evm");

    let transfer = reply.transfer;
    assert_eq!(transfer.from, Account::from(env.user));
    assert_eq!(transfer.chain, EvmChain::Ethereum);
    assert_eq!(transfer.recipient, RECIPIENT);
    assert_eq!(transfer.amount, NFT_VALUE_E8S);
    // signed in the call itself
    let OutboundStatus::Signed(voucher) = &transfer.status else {
        panic!("expected a signed voucher, got {:?}", transfer.status);
    };
    assert_eq!(voucher.icp_burn_index, (1u64 << 63) + transfer.id);
    assert_eq!(voucher.chain_id, 1);
    assert_eq!(
        voucher.token.to_lowercase(),
        FAKE_ETHEREUM_TOKEN.to_lowercase()
    );
    assert_eq!(voucher.recipient, RECIPIENT);
    assert_eq!(voucher.amount, NFT_VALUE_E8S);
    assert_eq!(
        recover(claim_digest(voucher), &voucher.signature),
        claims.to_lowercase()
    );

    // the NFT backs the EVM GLDT: bridged_out holds its value, the ICP supply did not move
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, NFT_VALUE_E8S);
    assert_eq!(status.out_pending, 0u64);
    assert_eq!(status.outbound, OutboundCounts::default());
    assert_eq!(total_supply(&env), supply_before);
    assert_eq!(
        owner(&env, &nft),
        Some(Account::from(env.gldt_swap_canister_id))
    );

    // one forward swap, complete and logged
    assert_eq!(reply.swap_ids.len(), 1);
    assert_eq!(
        logged_swap_status(&env, &reply.swap_ids[0]).as_deref(),
        Some("Complete")
    );
    assert!(get_active_swap_ids_by_user(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &Some(env.user)
    )
    .is_empty());

    assert_eq!(
        get_bridge_transfer_out(&env.pic, env.user, env.gldt_swap_canister_id, &transfer.id),
        Some(transfer.clone())
    );
    assert_eq!(
        get_bridge_transfers_out_by_account(
            &env.pic,
            env.user,
            env.gldt_swap_canister_id,
            &(Account::from(env.user), None, 10),
        ),
        vec![transfer]
    );

    // the supply balancer counts the NFT's value as bridged out, so it mints nothing
    const NO_MINT: &str = "has sufficient supply, skipping mint";
    assert!(
        !canister_logs(&env).contains(NO_MINT),
        "the balancer ran before the swap"
    );
    manual_gldt_supply_balance(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    env.tick_n(10);
    let logs = canister_logs(&env);
    assert!(
        logs.contains(NO_MINT),
        "the balancer did not reach its supply check: {logs}"
    );
    assert_eq!(total_supply(&env), supply_before);
}

#[test]
fn swap_nft_for_evm_while_paused_moves_no_nft() {
    let mut env = BridgeEnvBuilder::new().with_nft_collection(1).build();
    start_all_chains(&mut env);
    wait_for_signers(&env);
    let nft = env.user_nfts[0].clone();
    bridge_pause(
        &env.pic,
        env.controller,
        env.gldt_swap_canister_id,
        &BridgePauseArgs {
            inbound: false,
            outbound: true,
        },
    );

    let err = swap_nft_for_evm(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &args(&nft, EvmChain::Base, RECIPIENT),
    )
    .unwrap_err();
    assert!(
        matches!(err, SwapNftForEvmError::Bridge(BridgeError::Paused)),
        "{err:?}"
    );

    assert_eq!(owner(&env, &nft), Some(Account::from(env.user)));
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, 0u64);
    assert_eq!(status.out_pending, 0u64);
    assert!(get_bridge_transfers_out_by_account(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &(Account::from(env.user), None, 10),
    )
    .is_empty());
    assert!(get_active_swap_ids_by_user(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &Some(env.user)
    )
    .is_empty());

    // once SNS governance unpauses, the same NFT and approval go through
    bridge_sns_action(
        &env.pic,
        env.sns_governance,
        env.gldt_swap_canister_id,
        &BridgeSnsAction::SetIcpPaused {
            inbound: None,
            outbound: Some(false),
        },
    )
    .expect("unpause");
    let reply = swap_nft_for_evm(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &args(&nft, EvmChain::Base, RECIPIENT),
    )
    .expect("swap_nft_for_evm after unpause");
    assert!(matches!(reply.transfer.status, OutboundStatus::Signed(_)));
    assert_eq!(
        owner(&env, &nft),
        Some(Account::from(env.gldt_swap_canister_id))
    );
}

#[test]
fn swap_nft_for_evm_pays_for_the_nfts_that_moved() {
    // two NFTs of one collection, and only the first is approved for gldt_swap
    let mut env = BridgeEnvBuilder::new()
        .with_nft_collection(2)
        .with_unapproved_nfts(1)
        .build();
    start_all_chains(&mut env);
    wait_for_signers(&env);
    let approved = env.user_nfts[0].clone();
    let unapproved = env.user_nfts[1].clone();
    assert_eq!(approved.canister_id, unapproved.canister_id);
    let supply_before = total_supply(&env);

    let reply = swap_nft_for_evm(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &SwapNftForEvmArgs {
            nfts: [approved.clone(), unapproved.clone()].into_iter().collect(),
            chain: EvmChain::Ethereum,
            recipient: RECIPIENT.to_string(),
        },
    )
    .expect("swap_nft_for_evm with one NFT approved");

    // the voucher is for the approved NFT alone
    let transfer = reply.transfer;
    assert_eq!(transfer.amount, NFT_VALUE_E8S);
    let OutboundStatus::Signed(voucher) = &transfer.status else {
        panic!("expected a signed voucher, got {:?}", transfer.status);
    };
    assert_eq!(voucher.amount, NFT_VALUE_E8S);
    let status = get_bridge_status(&env.pic, env.user, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, NFT_VALUE_E8S);
    assert_eq!(status.out_pending, 0u64);
    assert_eq!(total_supply(&env), supply_before);

    assert_eq!(
        owner(&env, &approved),
        Some(Account::from(env.gldt_swap_canister_id))
    );
    assert_eq!(owner(&env, &unapproved), Some(Account::from(env.user)));

    // both swaps are finished: the approved one complete and logged, the other failed
    assert_eq!(reply.swap_ids.len(), 2);
    assert!(get_active_swap_ids_by_user(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &Some(env.user)
    )
    .is_empty());
    let failed = get_failed_swaps_by_user(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &Some(env.user),
    );
    assert_eq!(failed.len(), 1, "{failed:?}");
    let failed_swap = failed.values().next().unwrap();
    assert_eq!(failed_swap.nft, unapproved);
    assert!(
        matches!(failed_swap.status, SwapStatus::NftTransferFromFailed(_)),
        "{:?}",
        failed_swap.status
    );
    let complete = reply
        .swap_ids
        .iter()
        .find(|id| **id != failed_swap.index)
        .unwrap();
    assert_eq!(
        logged_swap_status(&env, complete).as_deref(),
        Some("Complete")
    );
    assert_eq!(logged_swap_status(&env, &failed_swap.index), None);
}
