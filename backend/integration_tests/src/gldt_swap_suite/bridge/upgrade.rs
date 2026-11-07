use crate::client::gldt_swap::{bridge_pause, get_bridge_evm_signers, get_bridge_status};
use crate::gldt_swap_suite::bridge::setup::{
    bridge_config, bridge_upgrade, setup_bridge_env, start_all_chains, wait_for_signers,
    BridgeEnvBuilder,
};
use candid::encode_one;
use gldt_swap_common::bridge::{
    BridgePauseArgs, BridgeUpgrade, ChainReset, EvmChain, GetBridgeEvmSignersResponse,
};

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
