//! Typed EVM admin actions: the canister builds every `execute` call itself from a
//! typed action, so voters read what they approve, and signs the batch with its admin key.
//!
//! Every call targets the chain's configured token or its LayerZero endpoint, and only through
//! [encode_call], which applies the address, ULN and executor rules and never reorders a list.
//! On top of that come the policy checks: the gas bounds of the contract, a minimum burn above
//! 0, a validity of at most `admin_action_max_validity_secs` (30 days at most), a configured
//! chain and a loaded admin key. The nonce is the action id, and the voter text, built from the
//! same calls that are signed, is stored as the action's description.

use crate::bridge::config::MAX_ADMIN_ACTION_VALIDITY_SECS;
use crate::bridge::evm::abi::{encode_call, TargetedCall};
use crate::bridge::evm::address::{format_address, parse_address};
use crate::bridge::evm::eip712::execute_digest;
use crate::bridge::outbound::MAX_TRANSFERS_PER_PAGE;
use crate::bridge::stable::with_admin_actions;
use crate::bridge::state::{BridgeState, EvmSigner, SignedAdminAction};
use crate::queries::icrc21::format_gldt;
use alloy_primitives::keccak256;
use gldt_swap_common::bridge::{
    BridgeConfig, EvmAdminAction, EvmAdminRequest, EvmChain, SignedEvmAdminAction,
};

/// The contract's bounds for `setLzReceiveGas` (`MIN_LZ_RECEIVE_GAS`, `MAX_LZ_RECEIVE_GAS`).
pub const MIN_LZ_RECEIVE_GAS: u64 = 100_000;
pub const MAX_LZ_RECEIVE_GAS: u64 = 500_000;

const NANOS_PER_SEC: u64 = 1_000_000_000;
const HOUR: u64 = 60 * 60;
const DAY: u64 = 24 * HOUR;

/// A request that passed every check, with its calls and voter text.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CheckedRequest {
    pub chain: EvmChain,
    pub chain_id: u64,
    pub token: [u8; 20],
    pub calls: Vec<TargetedCall>,
    /// Seconds the signature stays valid after execution.
    pub valid_for: u64,
    pub text: String,
}

/// A [SignedAdminAction] before its signature.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PendingAdminAction {
    /// Also the `execute` nonce.
    pub id: u64,
    pub chain: EvmChain,
    pub chain_id: u64,
    pub token: [u8; 20],
    pub calls: Vec<TargetedCall>,
    /// Unix seconds.
    pub deadline: u64,
    /// The EIP-712 `Execute` digest the admin key signs.
    pub digest: [u8; 32],
    /// The validator's text for this request.
    pub description: String,
}

impl PendingAdminAction {
    pub fn signed(self, signature: [u8; 65], created_at: u64) -> SignedAdminAction {
        SignedAdminAction {
            id: self.id,
            chain: self.chain,
            chain_id: self.chain_id,
            token: self.token,
            calls: self.calls,
            deadline: self.deadline,
            digest: self.digest,
            signature,
            description: self.description,
            created_at,
        }
    }
}

/// Checks one request and builds its calls and voter text. Changes nothing.
pub fn check_request(state: &BridgeState, req: &EvmAdminRequest) -> Result<CheckedRequest, String> {
    let config = state
        .config
        .as_ref()
        .ok_or_else(|| "the bridge is not configured".to_string())?;
    if state.admin_signer.is_none() {
        return Err("the admin key is not loaded yet".to_string());
    }
    let chain = req.chain;
    let cfg = state
        .chain_config(chain)
        .ok_or_else(|| format!("{chain:?} is not configured"))?;
    let token = parse_address(&cfg.token)?;
    let endpoint = parse_address(&cfg.lz_endpoint)?;
    if req.actions.is_empty() {
        return Err(format!("the {chain:?} request has no action"));
    }
    let max = config
        .admin_action_max_validity_secs
        .min(MAX_ADMIN_ACTION_VALIDITY_SECS);
    let valid_for = req
        .valid_for_secs
        .unwrap_or(config.admin_action_validity_secs);
    if valid_for == 0 || valid_for > max {
        return Err(format!(
            "{chain:?}: valid_for_secs {valid_for} is not 1 to {max}"
        ));
    }

    let mut text = format!(
        "{chain:?} ({}), GLDT {}:",
        cfg.chain_id,
        format_address(&token)
    );
    let mut calls = Vec::new();
    for (i, action) in req.actions.iter().enumerate() {
        let step = i + 1;
        let fail = |e: String| format!("{chain:?} step {step}: {e}");
        check_policy(action).map_err(fail)?;
        let action_calls = encode_call(action, token, endpoint).map_err(fail)?;
        for (n, line) in describe(state, config, action).iter().enumerate() {
            if n == 0 {
                text.push_str(&format!("\n  Step {step}: {line}"));
            } else {
                text.push_str(&format!("\n     {line}"));
            }
        }
        for (target, data) in &action_calls {
            let role = if *target == token {
                "token"
            } else {
                "LayerZero endpoint"
            };
            text.push_str(&format!(
                "\n     target {} ({role}), data keccak {}",
                format_address(target),
                keccak256(data)
            ));
        }
        calls.extend(action_calls);
    }
    text.push_str(&format!(
        "\n  Valid for {} after execution.",
        duration(valid_for)
    ));
    Ok(CheckedRequest {
        chain,
        chain_id: cfg.chain_id,
        token,
        calls,
        valid_for,
        text,
    })
}

/// The rules [encode_call] does not know: the contract's gas bounds and a minimum above 0.
fn check_policy(action: &EvmAdminAction) -> Result<(), String> {
    match action {
        EvmAdminAction::SetLzReceiveGas { gas, .. }
            if !u64::try_from(&gas.0)
                .is_ok_and(|gas| (MIN_LZ_RECEIVE_GAS..=MAX_LZ_RECEIVE_GAS).contains(&gas)) =>
        {
            Err(format!(
                "gas {} is not {MIN_LZ_RECEIVE_GAS} to {MAX_LZ_RECEIVE_GAS}",
                gas.0
            ))
        }
        EvmAdminAction::SetMinBurnToIcp { amount } if *amount == 0u8 => {
            Err("the smallest burnToIcp must be above 0".to_string())
        }
        _ => Ok(()),
    }
}

/// Added to the warnings of `SetIcpSigner` and `SetAdminSigner`: the scraper compares the
/// token's signers with the canister's keys at every window.
const SCRAPER_STOPS: &str = " Unless the new signer is this canister's key, the scraper on this \
     chain stops at its next window. Inbound transfers on this chain then need an SNS upgrade \
     with a ChainReset.";

/// The action in plain words: one line, then any detail or warning lines.
fn describe(state: &BridgeState, config: &BridgeConfig, action: &EvmAdminAction) -> Vec<String> {
    use EvmAdminAction::*;
    let eid = |eid: u32| {
        config.chains.iter().find(|c| c.lz_eid == eid).map_or_else(
            || format!("eid {eid}"),
            |c| format!("{:?} ({eid})", c.chain),
        )
    };
    match action {
        SetPaused {
            lz_paused,
            icp_bridge_paused,
        } => vec![format!(
            "Set the token's pause flags: LayerZero paused {lz_paused}, ICP bridge paused {icp_bridge_paused}"
        )],
        SetLzReceiveGas { dst_eid, gas } => vec![format!(
            "Set the lzReceive gas for sends to {} to {}",
            eid(*dst_eid),
            gas.0
        )],
        SetOperator { operator: None } => {
            vec!["Remove the operator (set it to the zero address)".to_string()]
        }
        SetOperator {
            operator: Some(operator),
        } => vec![format!("Set the operator to {}", address(operator))],
        SetIcpSigner { signer } => vec![
            format!("Set the claims signer (icpSigner) to {}", address(signer)),
            format!(
                "WARNING: this moves voucher signing for this token: after it, only vouchers \
                 signed by {} can claim. This canister's claims key is {}.{SCRAPER_STOPS}",
                address(signer),
                key(&state.claims_signer)
            ),
        ],
        SetAdminSigner { signer } => vec![
            format!("Set the admin signer (adminSigner) to {}", address(signer)),
            format!(
                "WARNING: this moves control of the token: after it, only {} can sign execute. \
                 This canister's admin key is {}.{SCRAPER_STOPS}",
                address(signer),
                key(&state.admin_signer)
            ),
        ],
        SetMinBurnToIcp { amount } => vec![format!(
            "Set the smallest burnToIcp to {} e8s ({} GLDT)",
            amount.0,
            format_gldt(amount)
        )],
        SetPeer { eid: e, peer } => vec![format!(
            "Set the LayerZero peer for {} to {}",
            eid(*e),
            address(peer)
        )],
        SetSendLibrary { eid: e, lib } => vec![format!(
            "Set the send library for {} to {}",
            eid(*e),
            address(lib)
        )],
        SetReceiveLibrary {
            eid: e,
            lib,
            grace_period,
        } => vec![format!(
            "Set the receive library for {} to {}, grace period {} blocks",
            eid(*e),
            address(lib),
            grace_period.0
        )],
        SetUlnConfig {
            lib,
            eid: e,
            confirmations,
            required_dvns,
            optional_dvns,
            optional_threshold,
        } => {
            let optional = if optional_dvns.is_empty() {
                "no optional DVNs".to_string()
            } else {
                format!(
                    "optional DVNs {} with threshold {optional_threshold}",
                    addresses(optional_dvns)
                )
            };
            vec![
                format!(
                    "Set the ULN config on library {} for {}:",
                    address(lib),
                    eid(*e)
                ),
                format!(
                    "confirmations {confirmations}, required DVNs {}, {optional}",
                    addresses(required_dvns)
                ),
            ]
        }
        SetExecutorConfig {
            lib,
            eid: e,
            max_message_size,
            executor,
        } => vec![format!(
            "Set the executor config on library {} for {}: executor {}, max message size {max_message_size} bytes",
            address(lib),
            eid(*e),
            address(executor)
        )],
        BurnLzMessage {
            src_eid,
            sender,
            nonce,
            payload_hash,
        } => vec![format!(
            "Burn the held LayerZero message from {}: sender {}, nonce {nonce}, payload hash {}",
            eid(*src_eid),
            address(sender),
            payload_hash.to_lowercase()
        )],
        Upgrade {
            implementation,
            code_hash,
        } => vec![format!(
            "Upgrade the token to implementation {} with code hash {}",
            address(implementation),
            code_hash.to_lowercase()
        )],
        CancelNonce { nonce } => vec![format!(
            "Cancel the signed admin action with nonce {nonce}, so it can never run"
        )],
    }
}

/// EIP-55. Only called after [encode_call] accepted the text.
fn address(text: &str) -> String {
    parse_address(text).map_or_else(|_| text.to_string(), |a| format_address(&a))
}

fn addresses(texts: &[String]) -> String {
    let list: Vec<String> = texts.iter().map(|t| address(t)).collect();
    format!("[{}]", list.join(", "))
}

fn key(signer: &Option<EvmSigner>) -> String {
    signer
        .as_ref()
        .map_or_else(|| "not loaded".to_string(), |s| format_address(&s.address))
}

/// Whole days or hours when it divides, otherwise seconds.
fn duration(secs: u64) -> String {
    let (n, unit) = if secs.is_multiple_of(DAY) {
        (secs / DAY, "day")
    } else if secs.is_multiple_of(HOUR) {
        (secs / HOUR, "hour")
    } else {
        (secs, "second")
    };
    format!("{n} {unit}{}", if n == 1 { "" } else { "s" })
}

/// Checks `req` again and builds its unsigned action: id = nonce = `next_admin_action_id`,
/// which moves on by one, and deadline = now + the validity. `now` is in nanoseconds; the
/// deadline is in Unix seconds. On `Err` nothing changes.
pub fn build_signed_request(
    state: &mut BridgeState,
    req: &EvmAdminRequest,
    now: u64,
) -> Result<PendingAdminAction, String> {
    let checked = check_request(state, req)?;
    let id = state.next_admin_action_id;
    let next = id
        .checked_add(1)
        .ok_or_else(|| "the admin action ids ran out".to_string())?;
    let deadline = (now / NANOS_PER_SEC)
        .checked_add(checked.valid_for)
        .ok_or_else(|| "the deadline does not fit u64".to_string())?;
    let digest = execute_digest(
        checked.chain_id,
        checked.token,
        &checked.calls,
        id,
        deadline,
    );
    state.next_admin_action_id = next;
    Ok(PendingAdminAction {
        id,
        chain: checked.chain,
        chain_id: checked.chain_id,
        token: checked.token,
        calls: checked.calls,
        deadline,
        digest,
        description: checked.text,
    })
}

/// Stores a signed action in map 4.
pub fn store_signed(action: SignedAdminAction) {
    with_admin_actions(|m| m.insert(action.id, action));
}

pub fn admin_action(id: u64) -> Option<SignedEvmAdminAction> {
    with_admin_actions(|m| m.get(&id)).map(|a| a.to_candid())
}

/// Signed actions, newest first. `start` is an exclusive upper bound on the id (the last id of
/// the previous page); `None` starts at the newest. At most [MAX_TRANSFERS_PER_PAGE].
pub fn admin_actions(start: Option<u64>, limit: u32) -> Vec<SignedEvmAdminAction> {
    let limit = limit.min(MAX_TRANSFERS_PER_PAGE) as usize;
    with_admin_actions(|m| {
        let range = match start {
            Some(start) => m.range(..start),
            None => m.range(..),
        };
        range
            .rev()
            .take(limit)
            .map(|entry| entry.value().to_candid())
            .collect()
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::configured_state;
    use crate::bridge::evm::abi::encode_call;
    use crate::bridge::evm::address::{evm_address, format_address, parse_address};
    use crate::bridge::evm::eip712::execute_digest;
    use crate::bridge::evm::vectors::{public_key, recover, signing_key, to_bytes64};
    use crate::bridge::signer::normalize_signature;
    use crate::bridge::state::{BridgeState, EvmSigner};
    use crate::bridge::test_state::install;
    use crate::state::RuntimeState;
    use candid::Nat;
    use gldt_swap_common::bridge::{EvmAdminAction, EvmAdminRequest, EvmChain};
    use num_bigint::BigUint;

    const NOW: u64 = 1_762_000_000_000_000_000;
    const DAY: u64 = 24 * 60 * 60;
    const DVN_A: &str = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const DVN_B: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const LIB: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const OTHER_KEY: &str = "0x216C1E5F2b9EB767Cec5C7d4DFa2d02b5A0AA143";

    fn signer() -> EvmSigner {
        let public_key = public_key(&signing_key());
        EvmSigner {
            address: evm_address(&public_key),
            public_key,
        }
    }

    /// Configured, with both keys loaded.
    fn ready() -> BridgeState {
        let mut state = configured_state();
        state.claims_signer = Some(signer());
        state.admin_signer = Some(signer());
        state
    }

    fn request(actions: Vec<EvmAdminAction>, valid_for_secs: Option<u64>) -> EvmAdminRequest {
        EvmAdminRequest {
            chain: EvmChain::Base,
            actions,
            valid_for_secs,
        }
    }

    fn check(state: &BridgeState, action: EvmAdminAction) -> Result<String, String> {
        check_request(state, &request(vec![action], None)).map(|c| c.text)
    }

    fn uln(
        required: &[&str],
        optional: &[&str],
        threshold: u8,
        confirmations: u64,
    ) -> EvmAdminAction {
        EvmAdminAction::SetUlnConfig {
            lib: LIB.to_string(),
            eid: 30101,
            confirmations,
            required_dvns: required.iter().map(|d| d.to_string()).collect(),
            optional_dvns: optional.iter().map(|d| d.to_string()).collect(),
            optional_threshold: threshold,
        }
    }

    fn min_burn(amount: Nat) -> EvmAdminAction {
        EvmAdminAction::SetMinBurnToIcp { amount }
    }

    fn gas(gas: u64) -> EvmAdminAction {
        EvmAdminAction::SetLzReceiveGas {
            dst_eid: 30101,
            gas: Nat::from(gas),
        }
    }

    #[test]
    fn uln_config_rules() {
        let state = ready();
        assert!(check(&state, uln(&[DVN_A, DVN_B], &[], 0, 15)).is_ok());
        assert!(check(&state, uln(&[DVN_A], &[DVN_B], 1, 15)).is_ok());

        let bad = [
            ("no required DVN", uln(&[], &[DVN_A], 1, 15)),
            ("unsorted required", uln(&[DVN_B, DVN_A], &[], 0, 15)),
            ("duplicate required", uln(&[DVN_A, DVN_A], &[], 0, 15)),
            ("unsorted optional", uln(&[DVN_A], &[DVN_B, DVN_A], 1, 15)),
            ("confirmations 0", uln(&[DVN_A, DVN_B], &[], 0, 0)),
            ("threshold without optional", uln(&[DVN_A], &[], 1, 15)),
            ("threshold 0 with optional", uln(&[DVN_A], &[DVN_B], 0, 15)),
            (
                "zero DVN",
                uln(&[&format!("0x{}", "0".repeat(40))], &[], 0, 15),
            ),
        ];
        for (what, action) in bad {
            assert!(check(&state, action).is_err(), "{what} was accepted");
        }

        let mut executor = EvmAdminAction::SetExecutorConfig {
            lib: LIB.to_string(),
            eid: 30101,
            max_message_size: 10_000,
            executor: DVN_A.to_string(),
        };
        assert!(check(&state, executor.clone()).is_ok());
        if let EvmAdminAction::SetExecutorConfig {
            max_message_size, ..
        } = &mut executor
        {
            *max_message_size = 0;
        }
        assert!(check(&state, executor).is_err());
    }

    #[test]
    fn gas_outside_bounds_and_min_zero_rejected() {
        let state = ready();
        for ok in [100_000, 250_000, 500_000] {
            assert!(check(&state, gas(ok)).is_ok(), "{ok}");
        }
        for bad in [0, 99_999, 500_001, u64::MAX] {
            let err = check(&state, gas(bad)).unwrap_err();
            assert!(err.contains("100000 to 500000"), "{err}");
        }

        assert!(check(&state, min_burn(Nat::from(0u8)))
            .unwrap_err()
            .contains("above 0"));
        assert!(check(&state, min_burn(Nat::from(1u8))).is_ok());
        let max = Nat((BigUint::from(1u8) << 256usize) - 1u8);
        assert!(check(&state, min_burn(max)).is_ok());
        // above 2^256 - 1 is an error, never a panic
        let too_big = Nat(BigUint::from(1u8) << 256usize);
        assert!(check(&state, min_burn(too_big))
            .unwrap_err()
            .contains("2^256"));
    }

    #[test]
    fn valid_for_over_30_days_rejected() {
        let mut state = ready();
        let action = || vec![min_burn(Nat::from(200_000_000u64))];

        let text = check_request(&state, &request(action(), None))
            .unwrap()
            .text;
        assert!(
            text.ends_with("Valid for 7 days after execution."),
            "{text}"
        );
        let checked = check_request(&state, &request(action(), Some(30 * DAY))).unwrap();
        assert_eq!(checked.valid_for, 30 * DAY);
        assert!(checked.text.ends_with("Valid for 30 days after execution."));
        let checked = check_request(&state, &request(action(), Some(3 * 60 * 60))).unwrap();
        assert!(checked.text.ends_with("Valid for 3 hours after execution."));

        for bad in [30 * DAY + 1, 0, u64::MAX] {
            assert!(
                check_request(&state, &request(action(), Some(bad))).is_err(),
                "{bad}"
            );
        }
        // the config's own maximum applies too
        state
            .config
            .as_mut()
            .unwrap()
            .admin_action_max_validity_secs = 10 * DAY;
        assert!(check_request(&state, &request(action(), Some(11 * DAY))).is_err());
        assert!(check_request(&state, &request(action(), Some(10 * DAY))).is_ok());
    }

    #[test]
    fn requests_need_a_configured_chain_the_admin_key_and_an_action() {
        let state = ready();
        assert!(check_request(&state, &request(vec![], None)).is_err());

        let mut no_key = ready();
        no_key.admin_signer = None;
        let err = check(&no_key, gas(200_000)).unwrap_err();
        assert!(err.contains("admin key"), "{err}");

        let mut one_chain = ready();
        one_chain.config.as_mut().unwrap().chains.truncate(1);
        let err = check(&one_chain, gas(200_000)).unwrap_err();
        assert!(err.contains("Base is not configured"), "{err}");

        assert!(check(&BridgeState::default(), gas(200_000)).is_err());
    }

    #[test]
    fn signer_changes_carry_a_warning_in_text() {
        let state = ready();
        let own = format_address(&signer().address);

        let text = check(
            &state,
            EvmAdminAction::SetAdminSigner {
                signer: OTHER_KEY.to_string(),
            },
        )
        .unwrap();
        assert!(text.contains("WARNING"), "{text}");
        assert!(text.contains("moves control of the token"), "{text}");
        assert!(text.contains("stops at its next window"), "{text}");
        assert!(
            text.contains("need an SNS upgrade with a ChainReset"),
            "{text}"
        );
        assert!(text.contains(OTHER_KEY), "{text}");
        assert!(text.contains(&own), "{text}");

        let text = check(
            &state,
            EvmAdminAction::SetIcpSigner {
                signer: OTHER_KEY.to_string(),
            },
        )
        .unwrap();
        assert!(text.contains("WARNING"), "{text}");
        assert!(text.contains("voucher signing"), "{text}");
        assert!(text.contains("stops at its next window"), "{text}");
        assert!(text.contains(OTHER_KEY), "{text}");

        let text = check(&state, min_burn(Nat::from(200_000_000u64))).unwrap();
        assert!(!text.contains("WARNING"), "{text}");
    }

    #[test]
    fn every_action_gets_a_line_and_its_calls() {
        let state = ready();
        let actions = vec![
            EvmAdminAction::SetPaused {
                lz_paused: true,
                icp_bridge_paused: false,
            },
            gas(200_000),
            EvmAdminAction::SetOperator { operator: None },
            EvmAdminAction::SetOperator {
                operator: Some(DVN_B.to_string()),
            },
            EvmAdminAction::SetIcpSigner {
                signer: OTHER_KEY.to_string(),
            },
            EvmAdminAction::SetAdminSigner {
                signer: OTHER_KEY.to_string(),
            },
            min_burn(Nat::from(200_000_000u64)),
            EvmAdminAction::SetPeer {
                eid: 30101,
                peer: DVN_A.to_string(),
            },
            EvmAdminAction::SetSendLibrary {
                eid: 30101,
                lib: LIB.to_string(),
            },
            EvmAdminAction::SetReceiveLibrary {
                eid: 30110,
                lib: LIB.to_string(),
                grace_period: Nat::from(0u8),
            },
            uln(&[DVN_A, DVN_B], &[], 0, 15),
            EvmAdminAction::SetExecutorConfig {
                lib: LIB.to_string(),
                eid: 30101,
                max_message_size: 10_000,
                executor: DVN_A.to_string(),
            },
            EvmAdminAction::BurnLzMessage {
                src_eid: 30101,
                sender: DVN_A.to_string(),
                nonce: 3,
                payload_hash: format!("0x{}", "ab".repeat(32)),
            },
            EvmAdminAction::Upgrade {
                implementation: DVN_B.to_string(),
                code_hash: format!("0x{}", "cd".repeat(32)),
            },
            EvmAdminAction::CancelNonce { nonce: 9 },
        ];
        let checked = check_request(&state, &request(actions.clone(), None)).unwrap();
        assert_eq!(checked.calls.len(), actions.len());
        for step in 1..=actions.len() {
            assert!(
                checked.text.contains(&format!("  Step {step}: ")),
                "{}",
                checked.text
            );
        }
        assert_eq!(
            checked.text.matches(", data keccak 0x").count(),
            actions.len()
        );
        // a configured eid is named, another is shown as a number
        assert!(
            checked.text.contains("Ethereum (30101)"),
            "{}",
            checked.text
        );
        assert!(checked.text.contains("eid 30110"), "{}", checked.text);
        assert!(checked.text.contains("(token)"), "{}", checked.text);
        assert!(checked.text.contains("(LayerZero endpoint)"));
        // the upgrade names this chain's implementation and code hash
        assert!(checked.text.contains(DVN_B));
        assert!(checked.text.contains(&"cd".repeat(32)));
    }

    #[test]
    fn nonce_is_action_id_and_increments() {
        let mut state = ready();
        let action = min_burn(Nat::from(200_000_000u64));
        let req = request(vec![action.clone()], None);
        let first = build_signed_request(&mut state, &req, NOW).unwrap();
        let second = build_signed_request(&mut state, &req, NOW + 1).unwrap();
        assert_eq!((first.id, second.id), (0, 1));
        assert_eq!(state.next_admin_action_id, 2);

        let cfg = state.chain_config(EvmChain::Base).unwrap();
        let token = parse_address(&cfg.token).unwrap();
        let endpoint = parse_address(&cfg.lz_endpoint).unwrap();
        let calls = encode_call(&action, token, endpoint).unwrap();
        assert_eq!(first.chain, EvmChain::Base);
        assert_eq!(first.chain_id, 8453);
        assert_eq!(first.token, token);
        assert_eq!(first.calls, calls);
        assert_eq!(first.deadline, NOW / 1_000_000_000 + 7 * DAY);
        // the nonce in the digest is the id
        assert_eq!(
            first.digest,
            execute_digest(8453, token, &calls, 0, first.deadline)
        );
        assert_eq!(
            second.digest,
            execute_digest(8453, token, &calls, 1, second.deadline)
        );
        assert_eq!(first.description, check_request(&state, &req).unwrap().text);

        // a rejected request takes no id
        let bad = request(vec![min_burn(Nat::from(0u8))], None);
        assert!(build_signed_request(&mut state, &bad, NOW).is_err());
        assert_eq!(state.next_admin_action_id, 2);

        // signed by the admin key, the stored action recovers to the admin address
        let mut runtime = RuntimeState::default();
        runtime.data.bridge = state;
        install(runtime);
        let (sig, _) = signing_key()
            .sign_prehash_recoverable(&first.digest)
            .unwrap();
        let signature =
            normalize_signature(to_bytes64(&sig), first.digest, &signer().public_key).unwrap();
        store_signed(first.clone().signed(signature, NOW));
        let stored = admin_action(0).unwrap();
        assert_eq!(stored.nonce, 0);
        assert_eq!(stored.deadline, first.deadline);
        assert_eq!(stored.description, first.description);
        assert_eq!(stored.created_at, NOW);
        assert_eq!(stored.calls.len(), 1);
        assert_eq!(stored.calls[0].data, calls[0].1);
        assert_eq!(
            recover(first.digest, stored.signature.strip_prefix("0x").unwrap()),
            signer().address
        );
        assert_eq!(admin_action(1), None);
    }

    #[test]
    fn admin_actions_page_newest_first() {
        let mut state = ready();
        let req = request(vec![gas(200_000)], None);
        let pending: Vec<_> = (0..3)
            .map(|_| build_signed_request(&mut state, &req, NOW).unwrap())
            .collect();
        let mut runtime = RuntimeState::default();
        runtime.data.bridge = state;
        install(runtime);
        for p in pending {
            store_signed(p.signed([1; 65], NOW));
        }
        let ids = |start, limit| -> Vec<u64> {
            admin_actions(start, limit).iter().map(|a| a.id).collect()
        };
        assert_eq!(ids(None, 10), vec![2, 1, 0]);
        assert_eq!(ids(None, 2), vec![2, 1]);
        assert_eq!(ids(Some(1), 10), vec![0]);
        assert_eq!(ids(Some(0), 10), Vec::<u64>::new());
        assert_eq!(ids(None, 0), Vec::<u64>::new());
    }
}
