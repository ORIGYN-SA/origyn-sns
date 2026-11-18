use crate::client::gldt_swap::{get_bridge_status, swap_nft_for_tokens};
use crate::client::icrc1::client::transfer;
use crate::client::icrc1::icrc1_total_supply;
use crate::gldt_swap_suite::bridge::setup::{
    bridge_out, bridge_upgrade, install_evm_rpc, start_chains, upgrade_gldt_swap,
};
use crate::gldt_swap_suite::setup::default_test_setup;
use crate::gldt_swap_suite::setup::setup_one_canister::{TestEnv, TestEnvBuilder};
use crate::utils::{random_principal, tick_n_blocks};
use candid::{Nat, Principal};
use gldt_swap_common::bridge::EvmChain;
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap::MANAGE_GLDT_SUPPLY_INTERVAL;
use icrc_ledger_types::icrc::generic_value::ICRC3Value;
use std::collections::HashSet;
use std::time::Duration;

#[test]
pub fn supply_manager_mints_when_burned() {
    let mut env = default_test_setup();
    let TestEnv {
        ref mut pic,
        mut origyn_nft_test_env,
        gldt_ledger_canister_id,
        gldt_swap_canister_id,
        owner_1,
        ..
    } = env;
    let pic = &pic.borrow();
    tick_n_blocks(pic, 10);

    // Initial supply
    let initial_supply =
        icrc1_total_supply(pic, Principal::anonymous(), gldt_ledger_canister_id, &());
    println!("Initial GLDT supply: {}", initial_supply);

    // Mint an NFT and approve
    let nft_1 = origyn_nft_test_env.mint_nft(
        owner_1,
        vec![(
            "name".to_string(),
            ICRC3Value::Text("supply_test".to_string()),
        )],
    );
    tick_n_blocks(pic, 5);
    origyn_nft_test_env.approve(owner_1, nft_1.clone(), gldt_swap_canister_id);
    tick_n_blocks(pic, 5);

    // Swap NFT for tokens
    let mut nfts_to_swap = HashSet::new();
    nfts_to_swap.insert(Nft {
        id: nft_1,
        canister_id: origyn_nft_test_env.collection_canister_id,
    });
    let swap_res = swap_nft_for_tokens(pic, owner_1, gldt_swap_canister_id, &nfts_to_swap);
    match &swap_res {
        Ok(ids) => println!("NFT swapped successfully, swap IDs: {:?}", ids),
        Err(e) => println!("NFT swap failed: {:?}", e),
    }
    tick_n_blocks(pic, 20);

    // Burn GLDT
    let amount_to_burn = 10_000_000u128;
    match transfer(
        &pic,
        owner_1,
        gldt_ledger_canister_id,
        None,
        gldt_swap_canister_id,
        amount_to_burn,
    ) {
        Ok(_) => println!("Burned 10_000_000 GLDT successfully"),
        Err(e) => println!("Burn failed: {:?}", e),
    }
    tick_n_blocks(pic, 10);

    // Check supply after burn
    let supply_after_burn =
        icrc1_total_supply(pic, Principal::anonymous(), gldt_ledger_canister_id, &());
    pic.advance_time(Duration::from_secs(60));
    println!("GLDT supply after burn: {}", supply_after_burn);

    // Trigger the supply manager job
    pic.advance_time(Duration::from_millis(MANAGE_GLDT_SUPPLY_INTERVAL));
    tick_n_blocks(pic, 40);
    pic.advance_time(Duration::from_millis(MANAGE_GLDT_SUPPLY_INTERVAL));
    tick_n_blocks(pic, 40);

    // Check supply after supply manager
    let final_supply =
        icrc1_total_supply(pic, Principal::anonymous(), gldt_ledger_canister_id, &());
    println!(
        "Final GLDT supply after supply manager job: {}",
        final_supply
    );

    assert!(
        final_supply == supply_after_burn + amount_to_burn,
        "GLDT supply should increase after supply manager mints more"
    );
}

/// GLDT bridged out to Ethereum or Base left the ICP ledger on purpose: the balancer refills
/// only ledger fee dust, never the bridged amount.
#[test]
pub fn balancer_does_not_remint_bridged_tokens() {
    let controller = random_principal();
    let env = TestEnvBuilder::new().with_controller(controller).build();
    let TestEnv {
        ref pic,
        mut origyn_nft_test_env,
        gldt_ledger_canister_id,
        gldt_swap_canister_id,
        owner_1,
        ..
    } = env;
    let pic = &pic.borrow();
    tick_n_blocks(pic, 10);

    // the bridge as at launch: the EVM RPC canister, an upgrade with the bridge config, and
    // both chains open
    install_evm_rpc(pic, controller);
    upgrade_gldt_swap(
        pic,
        controller,
        gldt_swap_canister_id,
        Some(bridge_upgrade(random_principal())),
    )
    .expect("upgrade with the bridge config");
    start_chains(pic, controller, gldt_swap_canister_id);

    // owner_1 swaps an NFT for GLDT, so the canister holds gold and the ledger matches it
    let nft = origyn_nft_test_env.mint_nft(
        owner_1,
        vec![(
            "name".to_string(),
            ICRC3Value::Text("bridge_supply_test".to_string()),
        )],
    );
    tick_n_blocks(pic, 5);
    origyn_nft_test_env.approve(owner_1, nft.clone(), gldt_swap_canister_id);
    tick_n_blocks(pic, 5);
    let nfts = HashSet::from([Nft {
        id: nft,
        canister_id: origyn_nft_test_env.collection_canister_id,
    }]);
    swap_nft_for_tokens(pic, owner_1, gldt_swap_canister_id, &nfts).expect("swap");
    tick_n_blocks(pic, 20);
    let supply_after_swap =
        icrc1_total_supply(pic, Principal::anonymous(), gldt_ledger_canister_id, &());

    // 1 GLDT goes out to Base, and 0.1 GLDT is burned as fees would burn it
    let bridged = 100_000_000u64;
    bridge_out(
        pic,
        gldt_ledger_canister_id,
        gldt_swap_canister_id,
        owner_1,
        EvmChain::Base,
        bridged,
    );
    transfer(
        pic,
        owner_1,
        gldt_ledger_canister_id,
        None,
        gldt_swap_canister_id,
        10_000_000u128,
    )
    .expect("burn");
    tick_n_blocks(pic, 10);
    let status = get_bridge_status(pic, controller, gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, Nat::from(bridged));
    let supply_before_balancer =
        icrc1_total_supply(pic, Principal::anonymous(), gldt_ledger_canister_id, &());
    assert!(supply_before_balancer < supply_after_swap.clone() - Nat::from(bridged));

    // two balancer runs
    for _ in 0..2 {
        pic.advance_time(Duration::from_millis(MANAGE_GLDT_SUPPLY_INTERVAL));
        tick_n_blocks(pic, 40);
    }

    // the dust (the burn and the approve fee) is back, the bridged GLDT is not
    let final_supply =
        icrc1_total_supply(pic, Principal::anonymous(), gldt_ledger_canister_id, &());
    assert_eq!(final_supply, supply_after_swap - Nat::from(bridged));
}
