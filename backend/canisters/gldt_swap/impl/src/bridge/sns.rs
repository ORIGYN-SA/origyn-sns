//! `bridge_sns_action` and its validator (spec 8.9): the one SNS generic function of the
//! bridge. Only ORIGYN SNS governance may call the action. Anyone may call the validator,
//! which only reads state, so proposers can preview the text.
//!
//! The validator returns the text voters read. The action runs the same checks again on the
//! state at execution, then:
//! - `SignEvmAdmin`: every request is checked, given its id (the `execute` nonce) and its
//!   digest in one step, then signed with the admin key, then all are stored together. A
//!   failed signature stores nothing; the ids it took are simply never used.
//! - `SetIcpPaused`: sets the ICP pause flags as given.
//! - `Resolve`: applies each resolve action in order.
//!
//! `SetIcpPaused` and `Resolve` never await, so a trap undoes every change they made.

use crate::bridge::admin_actions::{
    build_signed_request, check_request, store_signed, PendingAdminAction,
};
use crate::bridge::resolve::{apply_resolve, check_resolves};
use crate::bridge::signer::{sign_digest, SignerPath};
use crate::bridge::state::{BridgeState, Severity};
use crate::state::{mutate_state, read_state};
use candid::Principal;
pub use gldt_swap_common::bridge::BridgeSnsAction;
use tracing::info;
use utils::env::Environment;

/// Only the configured SNS governance; nobody while the bridge has no config.
pub fn check_caller(state: &BridgeState, caller: Principal) -> Result<(), String> {
    let config = state
        .config
        .as_ref()
        .ok_or_else(|| "the bridge is not configured".to_string())?;
    if caller == config.sns_governance {
        Ok(())
    } else {
        Err(format!(
            "{caller} is not the SNS governance canister of the bridge"
        ))
    }
}

/// Checks `action` against `state` and returns the text voters see. Changes nothing.
pub fn validate_action(state: &BridgeState, action: &BridgeSnsAction) -> Result<String, String> {
    if state.config.is_none() {
        return Err("the bridge is not configured".to_string());
    }
    match action {
        BridgeSnsAction::SignEvmAdmin(requests) => {
            if requests.is_empty() {
                return Err("SignEvmAdmin has no request".to_string());
            }
            let texts = requests
                .iter()
                .map(|req| check_request(state, req).map(|checked| checked.text))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(texts.join("\n\n"))
        }
        BridgeSnsAction::SetIcpPaused { inbound, outbound } => {
            if inbound.is_none() && outbound.is_none() {
                return Err("SetIcpPaused changes nothing".to_string());
            }
            Ok(format!(
                "Set the ICP side of the bridge: inbound mints: {}; outbound transfers: {}",
                pause_change(*inbound, state.paused_in),
                pause_change(*outbound, state.paused_out)
            ))
        }
        BridgeSnsAction::Resolve(actions) => check_resolves(state, actions),
    }
}

fn pause_change(new: Option<bool>, current: bool) -> String {
    let word = |paused: bool| if paused { "paused" } else { "running" };
    match new {
        None => format!("unchanged ({})", word(current)),
        Some(paused) => format!("from {} to {}", word(current), word(paused)),
    }
}

/// Runs `action` after checking it again. The caller traps on `Err`, so the proposal shows as
/// failed.
pub async fn run_action(action: BridgeSnsAction) -> Result<(), String> {
    let pending = mutate_state(|s| -> Result<Vec<PendingAdminAction>, String> {
        let now = s.env.now_nanos();
        let bridge = &mut s.data.bridge;
        validate_action(bridge, &action)?;
        match &action {
            BridgeSnsAction::SignEvmAdmin(requests) => requests
                .iter()
                .map(|req| build_signed_request(bridge, req, now))
                .collect(),
            BridgeSnsAction::SetIcpPaused { inbound, outbound } => {
                set_paused(bridge, *inbound, *outbound, now);
                Ok(Vec::new())
            }
            BridgeSnsAction::Resolve(actions) => {
                for resolve in actions {
                    apply_resolve(bridge, resolve)?;
                }
                info!(count = actions.len(), "bridge resolve actions applied");
                Ok(Vec::new())
            }
        }
    })?;
    if pending.is_empty() {
        return Ok(());
    }

    let mut signed = Vec::with_capacity(pending.len());
    for action in pending {
        let signature = sign_digest(SignerPath::Admin, action.digest).await?;
        signed.push((action, signature));
    }
    let now = read_state(|s| s.env.now_nanos());
    for (action, signature) in signed {
        info!(id = action.id, chain = ?action.chain, "bridge admin action signed");
        store_signed(action.signed(signature, now));
    }
    Ok(())
}

/// Sets the flags given, with an Info alert for each one that changes.
fn set_paused(bridge: &mut BridgeState, inbound: Option<bool>, outbound: Option<bool>, now: u64) {
    let mut changes = Vec::new();
    if let Some(paused) = inbound.filter(|p| *p != bridge.paused_in) {
        bridge.paused_in = paused;
        changes.push(("inbound", paused));
    }
    if let Some(paused) = outbound.filter(|p| *p != bridge.paused_out) {
        bridge.paused_out = paused;
        changes.push(("outbound", paused));
    }
    for (name, paused) in changes {
        let word = if paused { "paused" } else { "unpaused" };
        bridge.push_alert(
            now,
            Severity::Info,
            format!("bridge {name} {word} by an SNS proposal"),
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::{bridge_config, configured_state};
    use crate::bridge::evm::abi::encode_call;
    use crate::bridge::evm::address::{evm_address, parse_address};
    use crate::bridge::evm::vectors::{public_key, signing_key};
    use crate::bridge::scraper::save_burns;
    use crate::bridge::stable::with_inbound;
    use crate::bridge::state::{BridgeState, EvmSigner, InboundRecord};
    use crate::bridge::test_state::install;
    use crate::state::{read_state, RuntimeState};
    use alloy_primitives::{keccak256, U256};
    use candid::{Nat, Principal};
    use futures::executor::block_on;
    use gldt_swap_common::bridge::{
        EvmAdminAction, EvmAdminRequest, EvmChain, InboundStatus, ResolveAction,
    };
    use icrc_ledger_types::icrc1::account::Account;

    fn signer() -> EvmSigner {
        let public_key = public_key(&signing_key());
        EvmSigner {
            address: evm_address(&public_key),
            public_key,
        }
    }

    fn ready() -> BridgeState {
        let mut state = configured_state();
        state.claims_signer = Some(signer());
        state.admin_signer = Some(signer());
        state
    }

    fn install_bridge(bridge: BridgeState) {
        let mut state = RuntimeState::default();
        state.data.bridge = bridge;
        install(state);
    }

    fn flags() -> (bool, bool) {
        read_state(|s| (s.data.bridge.paused_in, s.data.bridge.paused_out))
    }

    #[test]
    fn only_sns_governance_may_call() {
        let governance = bridge_config().sns_governance;
        // no config: nobody
        assert!(check_caller(&BridgeState::default(), governance).is_err());

        let state = configured_state();
        assert_eq!(check_caller(&state, governance), Ok(()));
        for stranger in [
            Principal::anonymous(),
            Principal::from_slice(&[1; 29]),
            Principal::management_canister(),
        ] {
            assert!(check_caller(&state, stranger).is_err(), "{stranger}");
        }
    }

    #[test]
    fn validator_text_lists_chain_token_actions_targets_and_data_hash() {
        let state = ready();
        let action = EvmAdminAction::SetUlnConfig {
            lib: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".to_string(),
            eid: 30101,
            confirmations: 15,
            required_dvns: vec![
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".to_string(),
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".to_string(),
            ],
            optional_dvns: vec![],
            optional_threshold: 0,
        };
        let text = validate_action(
            &state,
            &BridgeSnsAction::SignEvmAdmin(vec![EvmAdminRequest {
                chain: EvmChain::Base,
                actions: vec![action.clone()],
                valid_for_secs: None,
            }]),
        )
        .unwrap();

        let expected = "\
Base (8453), GLDT 0x00000000000000000000000000000000000B1d6E:
  Step 1: Set the ULN config on library 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 for Ethereum (30101):
     confirmations 15, required DVNs [0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8], no optional DVNs
     target 0x1a44076050125825900e736c501f859c50fE728c (LayerZero endpoint), data keccak 0xc15246ad17cf97701fbbe7c0d88f5133816b86f8f6edc34f7f5499cae8b60db3
  Valid for 7 days after execution.";
        assert_eq!(text, expected);

        // the hash is of the calldata that is signed
        let cfg = state.chain_config(EvmChain::Base).unwrap();
        let calls = encode_call(
            &action,
            parse_address(&cfg.token).unwrap(),
            parse_address(&cfg.lz_endpoint).unwrap(),
        )
        .unwrap();
        assert!(text.contains(&format!("data keccak {}", keccak256(&calls[0].1))));
    }

    #[test]
    fn requests_for_both_chains_are_listed_in_order() {
        let state = ready();
        let request = |chain| EvmAdminRequest {
            chain,
            actions: vec![EvmAdminAction::CancelNonce { nonce: 4 }],
            valid_for_secs: None,
        };
        let text = validate_action(
            &state,
            &BridgeSnsAction::SignEvmAdmin(vec![
                request(EvmChain::Ethereum),
                request(EvmChain::Base),
            ]),
        )
        .unwrap();
        let eth = text.find("Ethereum (1), GLDT").unwrap();
        let base = text.find("\n\nBase (8453), GLDT").unwrap();
        assert!(eth < base, "{text}");

        assert!(validate_action(&state, &BridgeSnsAction::SignEvmAdmin(vec![])).is_err());
        // one bad request fails the whole proposal
        let mut bad = request(EvmChain::Base);
        bad.valid_for_secs = Some(0);
        assert!(validate_action(
            &state,
            &BridgeSnsAction::SignEvmAdmin(vec![request(EvmChain::Ethereum), bad])
        )
        .is_err());
        // nothing is valid before the bridge is configured
        assert!(validate_action(
            &BridgeState::default(),
            &BridgeSnsAction::SetIcpPaused {
                inbound: Some(false),
                outbound: None,
            }
        )
        .is_err());
    }

    #[test]
    fn set_icp_paused_sets_flags() {
        install_bridge(ready());
        let pause = |inbound, outbound| BridgeSnsAction::SetIcpPaused { inbound, outbound };

        let text =
            read_state(|s| validate_action(&s.data.bridge, &pause(Some(true), None))).unwrap();
        assert!(
            text.contains("inbound mints: from running to paused"),
            "{text}"
        );
        assert!(
            text.contains("outbound transfers: unchanged (running)"),
            "{text}"
        );

        block_on(run_action(pause(Some(true), None))).unwrap();
        assert_eq!(flags(), (true, false));
        block_on(run_action(pause(Some(false), Some(true)))).unwrap();
        assert_eq!(flags(), (false, true));
        block_on(run_action(pause(None, Some(false)))).unwrap();
        assert_eq!(flags(), (false, false));

        // an action that changes nothing is refused
        assert!(block_on(run_action(pause(None, None))).is_err());
        assert_eq!(flags(), (false, false));
    }

    #[test]
    fn runner_validates_again_and_applies_nothing_on_error() {
        let mut bridge = ready();
        bridge.bridged_out = 10;
        install_bridge(bridge);
        let record = |burn_id| InboundRecord {
            chain: EvmChain::Base,
            token: "0x00000000000000000000000000000000000B1D6E".to_string(),
            burn_id,
            tx_hash: format!("0x{:064x}", burn_id),
            log_index: 0,
            block_number: 200,
            evm_from: "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string(),
            to: Account::from(Principal::from_slice(&[7; 29])),
            amount: U256::from(4u8),
            discovered_at: 1,
            status: InboundStatus::Queued,
            created_at_time: None,
        };
        crate::state::mutate_state(|s| {
            let deployment = s.data.bridge.deployment(EvmChain::Base).unwrap();
            save_burns(&mut s.data.bridge, deployment, vec![record(0), record(1)])
        });
        let reject = |burn_id| ResolveAction::InboundReject {
            token: None,
            chain: EvmChain::Base,
            burn_id,
            reason: "forged".to_string(),
        };
        let minted = ResolveAction::InboundMarkMinted {
            token: None,
            chain: EvmChain::Base,
            burn_id: 1,
            icp_block_index: 3,
        };

        // the second action is wrong, so the first is not applied either
        let before = read_state(|s| s.data.bridge.clone());
        assert!(block_on(run_action(BridgeSnsAction::Resolve(vec![
            reject(0),
            minted.clone()
        ])))
        .is_err());
        assert_eq!(read_state(|s| s.data.bridge.clone()), before);

        block_on(run_action(BridgeSnsAction::Resolve(vec![reject(0)]))).unwrap();
        let deployment = before.deployment(EvmChain::Base).unwrap();
        assert_eq!(
            with_inbound(|m| m.get(&(deployment, 0))).unwrap().status,
            InboundStatus::Rejected("forged".to_string())
        );
        assert_eq!(read_state(|s| s.data.bridge.unminted_e8s), U256::from(4u8));
    }

    #[test]
    fn sign_evm_admin_needs_a_loaded_admin_key() {
        let mut state = ready();
        state.admin_signer = None;
        let action = BridgeSnsAction::SignEvmAdmin(vec![EvmAdminRequest {
            chain: EvmChain::Ethereum,
            actions: vec![EvmAdminAction::SetMinBurnToIcp {
                amount: Nat::from(2u8),
            }],
            valid_for_secs: None,
        }]);
        assert!(validate_action(&state, &action).is_err());
        assert!(validate_action(&ready(), &action).is_ok());
    }
}
