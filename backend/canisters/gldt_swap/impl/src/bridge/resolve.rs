//! SNS resolve actions (spec 8.11): a voted decision for a transfer the bridge can't settle
//! by itself. Each applies only from the status it is meant for, and moves the counters once.
//!
//! | Action | From | Effect |
//! |---|---|---|
//! | `InboundMarkMinted` | `NeedsManualCheck` | `Minted`; `bridged_out` and the unminted total down |
//! | `InboundRetry` | `NeedsManualCheck` | back on the mint queue with a new timestamp |
//! | `InboundMintTo` | `Quarantined` | back on the mint queue for the new account |
//! | `InboundReject` | `Queued`, `Quarantined` | `Rejected`; the unminted total down, `bridged_out` kept |
//! | `OutboundMarkBurned` | `NeedsManualCheck` | `Burned`, then signed; `out_pending` to `bridged_out` |
//! | `OutboundMarkFailed` | `NeedsManualCheck` | `Failed`; `out_pending` down |
//!
//! A `MintUnknown` mint may be in flight, and a `NeedsManualCheck` one may have minted, so
//! neither is ever rejected. A quarantined burn can be rejected: it was never minted, and it
//! would otherwise hold the supply guard for good. [check_resolves] follows the counters
//! through the list in order, so a list is accepted only if [apply_resolve] can apply all of it.

use crate::bridge::evm::address::{format_address, parse_address};
use crate::bridge::evm::num::u256_to_nat;
use crate::bridge::inbound::{release_unminted, store_inbound};
use crate::bridge::outbound::store_outbound;
use crate::bridge::stable::{with_inbound, with_outbound, with_queue, InboundKey};
use crate::bridge::state::{BridgeState, InboundRecord};
use crate::queries::icrc21::format_gldt;
use candid::Principal;
use gldt_swap_common::bridge::{
    EvmChain, InboundStatus, OutboundStatus, OutboundTransfer, ResolveAction,
};
use std::collections::BTreeSet;

/// `bridged_out` and `out_pending` as a list of actions moves them.
#[derive(Clone, Copy)]
struct Counters {
    bridged_out: u128,
    out_pending: u128,
}

impl Counters {
    fn of(state: &BridgeState) -> Self {
        Counters {
            bridged_out: state.bridged_out,
            out_pending: state.out_pending,
        }
    }
}

/// The record an action resolves.
enum Target {
    In(InboundKey, InboundRecord),
    Out(OutboundTransfer),
}

#[derive(PartialEq, Eq, PartialOrd, Ord)]
enum RecordId {
    In(InboundKey),
    Out(u64),
}

impl Target {
    fn id(&self) -> RecordId {
        match self {
            Target::In(key, _) => RecordId::In(*key),
            Target::Out(record) => RecordId::Out(record.id),
        }
    }
}

/// Checks a list of resolve actions in order and returns the voter text. Changes nothing.
pub fn check_resolves(state: &BridgeState, actions: &[ResolveAction]) -> Result<String, String> {
    if actions.is_empty() {
        return Err("Resolve has no action".to_string());
    }
    let mut counters = Counters::of(state);
    let mut seen = BTreeSet::new();
    let mut text = format!("Resolve {} bridge transfer(s):", actions.len());
    for (i, action) in actions.iter().enumerate() {
        let n = i + 1;
        let (target, line) =
            check_one(state, action, &mut counters).map_err(|e| format!("resolve {n}: {e}"))?;
        if !seen.insert(target.id()) {
            return Err(format!(
                "resolve {n}: the proposal names this transfer more than once"
            ));
        }
        text.push_str(&format!("\n  {n}. {line}"));
    }
    Ok(text)
}

/// Applies one resolve action, after the same checks as [check_resolves].
pub fn apply_resolve(state: &mut BridgeState, action: &ResolveAction) -> Result<(), String> {
    let (target, _) = check_one(state, action, &mut Counters::of(state))?;
    match (action, target) {
        (
            ResolveAction::InboundMarkMinted {
                icp_block_index, ..
            },
            Target::In(key, mut record),
        ) => {
            let amount = in_amount(&record)?;
            record.status = InboundStatus::Minted {
                icp_block_index: *icp_block_index,
            };
            store_inbound(state, key, &record);
            state.sub_bridged_out(amount);
            release_unminted(state, record.amount);
        }
        (ResolveAction::InboundRetry { .. }, Target::In(key, record)) => {
            requeue(state, key, record)?;
        }
        (ResolveAction::InboundMintTo { to, .. }, Target::In(key, mut record)) => {
            record.to = *to;
            requeue(state, key, record)?;
        }
        (ResolveAction::InboundReject { reason, .. }, Target::In(key, mut record)) => {
            record.status = InboundStatus::Rejected(reason.clone());
            store_inbound(state, key, &record);
            release_unminted(state, record.amount);
        }
        (ResolveAction::OutboundMarkBurned { icp_burn_index, .. }, Target::Out(mut record)) => {
            let amount = out_amount(&record)?;
            record.status = OutboundStatus::Burned {
                icp_burn_index: *icp_burn_index,
            };
            state.sub_out_pending(amount);
            state.add_bridged_out(amount);
            // `Burned` is processor work: its voucher is signed next
            store_outbound(state, &record);
        }
        (ResolveAction::OutboundMarkFailed { .. }, Target::Out(mut record)) => {
            let amount = out_amount(&record)?;
            record.status = OutboundStatus::Failed(
                "no burn found in the ledger; marked failed by an SNS resolve".to_string(),
            );
            state.sub_out_pending(amount);
            store_outbound(state, &record);
        }
        _ => return Err("the action does not match its record".to_string()),
    }
    Ok(())
}

/// Checks one action against its record and the counters before it, moves `counters` the way
/// the action does, and returns the record and the voter line.
fn check_one(
    state: &BridgeState,
    action: &ResolveAction,
    counters: &mut Counters,
) -> Result<(Target, String), String> {
    use InboundStatus as In;
    use ResolveAction::*;
    match action {
        InboundMarkMinted {
            chain,
            burn_id,
            token,
            icp_block_index,
        } => {
            let (key, record) = inbound(state, *chain, *burn_id, token)?;
            in_status(
                &record,
                matches!(record.status, In::NeedsManualCheck(_)),
                "NeedsManualCheck",
            )?;
            let amount = in_amount(&record)?;
            let after = counters.bridged_out.checked_sub(amount).ok_or_else(|| {
                format!(
                    "{}: bridged_out {} e8s is below its amount",
                    in_name(&record),
                    counters.bridged_out
                )
            })?;
            let line = format!(
                "{}: mark minted at ICP block {icp_block_index}; bridged_out from {} to {after} e8s",
                in_name(&record),
                counters.bridged_out
            );
            counters.bridged_out = after;
            Ok((Target::In(key, record), line))
        }
        InboundRetry {
            chain,
            burn_id,
            token,
        } => {
            let (key, record) = inbound(state, *chain, *burn_id, token)?;
            in_status(
                &record,
                matches!(record.status, In::NeedsManualCheck(_)),
                "NeedsManualCheck",
            )?;
            let line = format!(
                "{}: no mint happened, so back on the mint queue with a new timestamp",
                in_name(&record)
            );
            Ok((Target::In(key, record), line))
        }
        InboundMintTo {
            chain,
            burn_id,
            token,
            to,
        } => {
            let (key, record) = inbound(state, *chain, *burn_id, token)?;
            in_status(
                &record,
                matches!(record.status, In::Quarantined(_)),
                "Quarantined",
            )?;
            if to.owner == Principal::anonymous() {
                return Err("nobody controls the anonymous principal".to_string());
            }
            let line = format!(
                "{}: mint to {to} instead (on the mint queue; the supply guard and rule 1 apply)",
                in_name(&record)
            );
            Ok((Target::In(key, record), line))
        }
        InboundReject {
            chain,
            burn_id,
            token,
            reason,
        } => {
            let (key, record) = inbound(state, *chain, *burn_id, token)?;
            in_status(
                &record,
                matches!(record.status, In::Queued | In::Quarantined(_)),
                "Queued or Quarantined",
            )?;
            if reason.trim().is_empty() {
                return Err("a rejection needs a reason".to_string());
            }
            let line = format!(
                "{}: reject, nothing is minted and bridged_out stays {} e8s; reason: {reason}",
                in_name(&record),
                counters.bridged_out
            );
            Ok((Target::In(key, record), line))
        }
        OutboundMarkBurned { id, icp_burn_index } => {
            let record = outbound(*id)?;
            if let Some(other) = burned_at(*icp_burn_index) {
                return Err(format!(
                    "ICP block {icp_burn_index} is already the burn of outbound {other}"
                ));
            }
            let amount = out_amount(&record)?;
            let pending = counters.out_pending.checked_sub(amount);
            let bridged = counters.bridged_out.checked_add(amount);
            let (Some(pending), Some(bridged)) = (pending, bridged) else {
                return Err(format!(
                    "{}: the counters can't move by its amount",
                    out_name(&record)
                ));
            };
            let line = format!(
                "{}: mark burned at ICP block {icp_burn_index}, then sign its voucher; \
                 out_pending from {} to {pending} e8s, bridged_out from {} to {bridged} e8s",
                out_name(&record),
                counters.out_pending,
                counters.bridged_out
            );
            *counters = Counters {
                bridged_out: bridged,
                out_pending: pending,
            };
            Ok((Target::Out(record), line))
        }
        OutboundMarkFailed { id } => {
            let record = outbound(*id)?;
            let amount = out_amount(&record)?;
            let pending = counters
                .out_pending
                .checked_sub(amount)
                .ok_or_else(|| format!("{}: out_pending is below its amount", out_name(&record)))?;
            let line = format!(
                "{}: no burn happened, mark failed; out_pending from {} to {pending} e8s",
                out_name(&record),
                counters.out_pending
            );
            counters.out_pending = pending;
            Ok((Target::Out(record), line))
        }
    }
}

/// The burn on the chain's current token, or on `token`, an earlier token of the chain with
/// the same chain id (held records of a replaced token stay in the queue and the guard).
fn inbound(
    state: &BridgeState,
    chain: EvmChain,
    burn_id: u64,
    token: &Option<String>,
) -> Result<(InboundKey, InboundRecord), String> {
    let mut deployment = state
        .deployment(chain)
        .ok_or_else(|| format!("{chain:?} is not configured"))?;
    if let Some(text) = token {
        deployment.1 = parse_address(text).map_err(|e| format!("token {text}: {e}"))?;
        if !state.chains.contains_key(&deployment) {
            return Err(format!("{chain:?} never had the token {text}"));
        }
    }
    let key = (deployment, burn_id);
    let record = with_inbound(|m| m.get(&key)).ok_or_else(|| {
        format!(
            "no {chain:?} burn {burn_id} on token {}",
            format_address(&deployment.1)
        )
    })?;
    Ok((key, record))
}

fn in_status(record: &InboundRecord, ok: bool, expected: &str) -> Result<(), String> {
    if ok {
        Ok(())
    } else {
        Err(format!(
            "{} is {:?}, not {expected}",
            in_name(record),
            record.status
        ))
    }
}

fn in_amount(record: &InboundRecord) -> Result<u128, String> {
    u128::try_from(record.amount)
        .map_err(|_| format!("{}: the amount is above u128", in_name(record)))
}

fn in_name(record: &InboundRecord) -> String {
    format!(
        "{:?} burn {} on token {} of {} GLDT to {}",
        record.chain,
        record.burn_id,
        record.token,
        format_gldt(&u256_to_nat(record.amount)),
        record.to
    )
}

/// An outbound transfer that needs a manual check.
fn outbound(id: u64) -> Result<OutboundTransfer, String> {
    let record = with_outbound(|m| m.get(&id)).ok_or_else(|| format!("no outbound {id}"))?;
    if !matches!(record.status, OutboundStatus::NeedsManualCheck(_)) {
        return Err(format!(
            "{} is {:?}, not NeedsManualCheck",
            out_name(&record),
            record.status
        ));
    }
    Ok(record)
}

/// The outbound transfer whose burn is at ICP block `index`, if any. Two vouchers with one
/// burn index would share one `claimed` slot on the token, so only one could ever be claimed.
fn burned_at(index: u64) -> Option<u64> {
    with_outbound(|m| {
        m.iter()
            .map(|entry| entry.value())
            .find(|r| match &r.status {
                OutboundStatus::Burned { icp_burn_index } => *icp_burn_index == index,
                OutboundStatus::Signed(voucher) => voucher.icp_burn_index == index,
                _ => false,
            })
            .map(|r| r.id)
    })
}

fn out_amount(record: &OutboundTransfer) -> Result<u128, String> {
    u128::try_from(&record.amount.0)
        .map_err(|_| format!("{}: the amount is above u128", out_name(record)))
}

fn out_name(record: &OutboundTransfer) -> String {
    format!(
        "outbound {} of {} GLDT from {} to {} on {:?}",
        record.id,
        format_gldt(&record.amount),
        record.from,
        record.recipient,
        record.chain
    )
}

/// Back on the mint queue with a new sequence number and no timestamp, so the next mint takes
/// a new `created_at_time`.
fn requeue(
    state: &mut BridgeState,
    key: InboundKey,
    mut record: InboundRecord,
) -> Result<(), String> {
    let seq = state.next_queue_seq;
    state.next_queue_seq = seq
        .checked_add(1)
        .ok_or_else(|| "next_queue_seq overflow".to_string())?;
    record.status = InboundStatus::Queued;
    record.created_at_time = None;
    store_inbound(state, key, &record);
    with_queue(|q| q.insert(seq, key));
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::apply_bridge_upgrade;
    use crate::bridge::config::test_fixtures::configured_state;
    use crate::bridge::scraper::save_burns;
    use crate::bridge::stable::{with_inbound, with_outbound, with_queue, InboundKey};
    use crate::bridge::state::{BridgeState, InboundRecord};
    use crate::bridge::test_state::install;
    use crate::state::{mutate_state, read_state, RuntimeState};
    use alloy_primitives::U256;
    use candid::{Nat, Principal};
    use gldt_swap_common::bridge::{
        BridgeUpgrade, EvmChain, InboundStatus, OutboundStatus, OutboundTransfer, ResolveAction,
    };
    use icrc_ledger_types::icrc1::account::Account;

    /// 1 GLDT.
    const ONE: u128 = 100_000_000;
    const CHAIN: EvmChain = EvmChain::Base;

    fn user() -> Account {
        Account::from(Principal::from_slice(&[7; 29]))
    }

    fn setup(bridged_out: u128, out_pending: u128) {
        let mut bridge = configured_state();
        bridge.bridged_out = bridged_out;
        bridge.out_pending = out_pending;
        let mut state = RuntimeState::default();
        state.data.bridge = bridge;
        install(state);
    }

    fn key(burn_id: u64) -> InboundKey {
        (
            read_state(|s| s.data.bridge.deployment(CHAIN).unwrap()),
            burn_id,
        )
    }

    fn inbound(burn_id: u64) -> InboundRecord {
        with_inbound(|m| m.get(&key(burn_id))).unwrap()
    }

    fn outbound(id: u64) -> OutboundTransfer {
        with_outbound(|m| m.get(&id)).unwrap()
    }

    fn bridge() -> BridgeState {
        read_state(|s| s.data.bridge.clone())
    }

    fn queued_keys() -> Vec<InboundKey> {
        with_queue(|q| q.iter().map(|e| e.value()).collect())
    }

    /// Saves burns of `amounts` GLDT the way the scraper does (queued, counted as unminted).
    fn save(amounts: &[u128]) {
        let records = amounts
            .iter()
            .enumerate()
            .map(|(i, amount)| InboundRecord {
                chain: CHAIN,
                token: "0x00000000000000000000000000000000000B1D6E".to_string(),
                burn_id: i as u64,
                tx_hash: format!("0x{:064x}", i),
                log_index: i as u64,
                block_number: 200,
                evm_from: "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string(),
                to: user(),
                amount: U256::from(*amount),
                discovered_at: 1_000,
                status: InboundStatus::Queued,
                created_at_time: None,
            })
            .collect();
        mutate_state(|s| {
            let deployment = s.data.bridge.deployment(CHAIN).unwrap();
            save_burns(&mut s.data.bridge, deployment, records)
        });
    }

    /// Moves a saved burn to `status`, the way the processor does, with a fixed timestamp.
    fn set_status(burn_id: u64, status: InboundStatus) {
        let mut record = inbound(burn_id);
        record.status = status;
        record.created_at_time = Some(5);
        let key = key(burn_id);
        mutate_state(|s| store_inbound(&mut s.data.bridge, key, &record));
    }

    fn manual(text: &str) -> InboundStatus {
        InboundStatus::NeedsManualCheck(text.to_string())
    }

    /// An outbound transfer of `amount` with `status`; its amount is in `out_pending` already.
    fn put_outbound(id: u64, amount: u128, status: OutboundStatus) {
        let record = OutboundTransfer {
            id,
            from: user(),
            chain: CHAIN,
            recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".to_string(),
            amount: Nat::from(amount),
            created_at: 1,
            status,
        };
        mutate_state(|s| store_outbound(&mut s.data.bridge, &record));
    }

    /// Checks then applies `actions` in order, as `bridge_sns_action` does.
    fn resolve(actions: Vec<ResolveAction>) -> Result<String, String> {
        mutate_state(|s| {
            let text = check_resolves(&s.data.bridge, &actions)?;
            for action in &actions {
                apply_resolve(&mut s.data.bridge, action)?;
            }
            Ok(text)
        })
    }

    fn unminted() -> U256 {
        read_state(|s| s.data.bridge.unminted_e8s)
    }

    /// After a token replacement, burns held on the old token stay in the mint queue and in the
    /// unminted total. Only a resolve that names the old token reaches them.
    #[test]
    fn resolve_reaches_held_burn_of_a_replaced_token() {
        setup(10 * ONE, 0);
        save(&[2 * ONE]);
        let old_token = read_state(|s| s.data.bridge.chain_config(CHAIN).unwrap().token.clone());
        let old_key = key(0);
        let new_token = "0x000000000000000000000000000000000000bEEF";
        mutate_state(|s| {
            let mut cfg = s.data.bridge.config.clone().unwrap();
            for chain in cfg.chains.iter_mut().filter(|c| c.chain == CHAIN) {
                chain.token = new_token.to_string();
            }
            let upgrade = BridgeUpgrade {
                config: Some(cfg),
                chain_resets: vec![],
            };
            apply_bridge_upgrade(&mut s.data.bridge, upgrade).unwrap();
        });
        assert_ne!(key(0), old_key);
        let reject = |token: Option<&str>| ResolveAction::InboundReject {
            chain: CHAIN,
            burn_id: 0,
            token: token.map(str::to_string),
            reason: "forged".to_string(),
        };

        // without a token, only the current token is searched
        let err = resolve(vec![reject(None)]).unwrap_err();
        assert!(err.contains("no Base burn 0 on token 0x"), "{err}");
        // a token the chain never had is refused
        let err = resolve(vec![reject(Some(
            "0x000000000000000000000000000000000000dEaD",
        ))])
        .unwrap_err();
        assert!(err.contains("never had the token"), "{err}");
        assert_eq!(queued_keys(), vec![old_key]);

        // the old token reaches the held burn, and the text names it
        let text = resolve(vec![reject(Some(&old_token))]).unwrap();
        assert!(text.contains(&format!("on token {old_token}")), "{text}");
        assert_eq!(
            with_inbound(|m| m.get(&old_key)).unwrap().status,
            InboundStatus::Rejected("forged".to_string())
        );
        assert!(queued_keys().is_empty());
        assert_eq!(unminted(), U256::ZERO);
        assert_eq!(bridge().bridged_out, 10 * ONE);
    }

    #[test]
    fn resolve_inbound_mark_minted_reduces_bridged_out_and_unminted() {
        setup(10 * ONE, 0);
        save(&[4 * ONE, ONE]);
        set_status(0, manual("TooOld"));
        assert_eq!(unminted(), U256::from(5 * ONE));

        let text = resolve(vec![ResolveAction::InboundMarkMinted {
            token: None,
            chain: CHAIN,
            burn_id: 0,
            icp_block_index: 77,
        }])
        .unwrap();
        assert!(text.contains("burn 0"), "{text}");
        assert!(text.contains("ICP block 77"), "{text}");

        assert_eq!(
            inbound(0).status,
            InboundStatus::Minted {
                icp_block_index: 77
            }
        );
        let state = bridge();
        assert_eq!(state.bridged_out, 6 * ONE);
        assert_eq!(state.unminted_e8s, U256::from(ONE));
        assert!(state.inbound_held.is_empty());
        assert_eq!(queued_keys(), vec![key(1)]);
    }

    #[test]
    fn resolve_inbound_reject_removes_from_queue_and_unminted_keeps_bridged_out() {
        setup(10 * ONE, 0);
        save(&[5 * ONE, 3 * ONE, 2 * ONE]);
        set_status(2, InboundStatus::Quarantined("minting account".to_string()));

        // a burn the supply guard holds on the queue
        resolve(vec![ResolveAction::InboundReject {
            token: None,
            chain: CHAIN,
            burn_id: 0,
            reason: "forged LayerZero mint".to_string(),
        }])
        .unwrap();
        assert_eq!(
            inbound(0).status,
            InboundStatus::Rejected("forged LayerZero mint".to_string())
        );
        assert_eq!(queued_keys(), vec![key(1)]);
        assert_eq!(unminted(), U256::from(5 * ONE));
        assert_eq!(bridge().bridged_out, 10 * ONE);

        // a quarantined one leaves the held set
        resolve(vec![ResolveAction::InboundReject {
            token: None,
            chain: CHAIN,
            burn_id: 2,
            reason: "forged".to_string(),
        }])
        .unwrap();
        let state = bridge();
        assert!(state.inbound_held.is_empty());
        assert_eq!(state.unminted_e8s, U256::from(3 * ONE));
        assert_eq!(state.bridged_out, 10 * ONE);
        assert_eq!(queued_keys(), vec![key(1)]);

        // a reason is required
        assert!(resolve(vec![ResolveAction::InboundReject {
            token: None,
            chain: CHAIN,
            burn_id: 1,
            reason: " ".to_string(),
        }])
        .is_err());
    }

    #[test]
    fn resolve_retry_and_mint_to_requeue_with_a_new_timestamp() {
        setup(10 * ONE, 0);
        save(&[ONE, 2 * ONE, 3 * ONE]);
        set_status(0, manual("TooOld"));
        set_status(1, InboundStatus::Quarantined("minting account".to_string()));
        let seq_before = bridge().next_queue_seq;
        let other = Account {
            owner: Principal::from_slice(&[8; 29]),
            subaccount: Some([1; 32]),
        };

        resolve(vec![
            ResolveAction::InboundRetry {
                token: None,
                chain: CHAIN,
                burn_id: 0,
            },
            ResolveAction::InboundMintTo {
                token: None,
                chain: CHAIN,
                burn_id: 1,
                to: other,
            },
        ])
        .unwrap();

        let retried = inbound(0);
        assert_eq!(retried.status, InboundStatus::Queued);
        assert_eq!(retried.created_at_time, None);
        assert_eq!(retried.to, user());
        let moved = inbound(1);
        assert_eq!(moved.status, InboundStatus::Queued);
        assert_eq!(moved.created_at_time, None);
        assert_eq!(moved.to, other);

        // both go to the back of the queue, in order, with new sequence numbers
        assert_eq!(queued_keys(), vec![key(2), key(0), key(1)]);
        let state = bridge();
        assert_eq!(state.next_queue_seq, seq_before + 2);
        assert!(state.inbound_held.is_empty());
        // still unminted, and the mint processor counts them as any other burn
        assert_eq!(state.unminted_e8s, U256::from(6 * ONE));
        assert_eq!(state.bridged_out, 10 * ONE);

        // nobody controls the anonymous principal
        set_status(2, InboundStatus::Quarantined("x".to_string()));
        let err = resolve(vec![ResolveAction::InboundMintTo {
            token: None,
            chain: CHAIN,
            burn_id: 2,
            to: Account::from(Principal::anonymous()),
        }])
        .unwrap_err();
        assert!(err.contains("anonymous"), "{err}");
    }

    #[test]
    fn resolve_outbound_mark_burned_and_mark_failed_counters() {
        setup(0, 30 * ONE);
        put_outbound(
            0,
            10 * ONE,
            OutboundStatus::NeedsManualCheck("TooOld".into()),
        );
        put_outbound(
            1,
            20 * ONE,
            OutboundStatus::NeedsManualCheck("TooOld".into()),
        );

        let text = resolve(vec![
            ResolveAction::OutboundMarkBurned {
                id: 0,
                icp_burn_index: 99,
            },
            ResolveAction::OutboundMarkFailed { id: 1 },
        ])
        .unwrap();
        assert!(text.contains("outbound 0"), "{text}");
        assert!(text.contains("outbound 1"), "{text}");

        assert_eq!(
            outbound(0).status,
            OutboundStatus::Burned { icp_burn_index: 99 }
        );
        assert!(matches!(outbound(1).status, OutboundStatus::Failed(_)));
        let state = bridge();
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.bridged_out, 10 * ONE);
        // the processor signs the burned one's voucher next, and nothing waits for a resolve
        assert_eq!(
            state.outbound_work.iter().copied().collect::<Vec<_>>(),
            vec![0]
        );
        assert!(state.outbound_held.is_empty());
    }

    /// An ICP burn index belongs to one outbound transfer only.
    #[test]
    fn resolve_outbound_mark_burned_refuses_a_burn_index_in_use() {
        setup(0, 3 * ONE);
        put_outbound(0, ONE, OutboundStatus::Burned { icp_burn_index: 41 });
        put_outbound(1, ONE, OutboundStatus::NeedsManualCheck("TooOld".into()));
        put_outbound(2, ONE, OutboundStatus::NeedsManualCheck("TooOld".into()));
        let mark = |id, icp_burn_index| ResolveAction::OutboundMarkBurned { id, icp_burn_index };

        let err = resolve(vec![mark(1, 41)]).unwrap_err();
        assert!(err.contains("already the burn of outbound 0"), "{err}");
        // once outbound 1 carries index 42, outbound 2 can't take it, and stays as it was
        resolve(vec![mark(1, 42)]).unwrap();
        let err = resolve(vec![mark(2, 42)]).unwrap_err();
        assert!(err.contains("already the burn of outbound 1"), "{err}");
        assert!(matches!(
            outbound(2).status,
            OutboundStatus::NeedsManualCheck(_)
        ));
        assert_eq!(bridge().out_pending, 2 * ONE);
    }

    #[test]
    fn resolve_on_wrong_status_is_rejected() {
        setup(10 * ONE, 10 * ONE);
        save(&[ONE, ONE, ONE, ONE, ONE]);
        set_status(1, InboundStatus::MintUnknown);
        set_status(2, InboundStatus::Quarantined("x".to_string()));
        set_status(3, manual("x"));
        set_status(4, InboundStatus::Minted { icp_block_index: 1 });
        put_outbound(0, ONE, OutboundStatus::BurnUnknown);
        put_outbound(1, ONE, OutboundStatus::Burned { icp_burn_index: 3 });
        put_outbound(2, ONE, OutboundStatus::Failed("x".to_string()));
        put_outbound(3, ONE, OutboundStatus::NeedsManualCheck("x".to_string()));

        let minted = |burn_id| ResolveAction::InboundMarkMinted {
            token: None,
            chain: CHAIN,
            burn_id,
            icp_block_index: 1,
        };
        let retry = |burn_id| ResolveAction::InboundRetry {
            token: None,
            chain: CHAIN,
            burn_id,
        };
        let mint_to = |burn_id| ResolveAction::InboundMintTo {
            token: None,
            chain: CHAIN,
            burn_id,
            to: user(),
        };
        let reject = |burn_id| ResolveAction::InboundReject {
            token: None,
            chain: CHAIN,
            burn_id,
            reason: "forged".to_string(),
        };
        let burned = |id| ResolveAction::OutboundMarkBurned {
            id,
            icp_burn_index: 1,
        };
        let failed = |id| ResolveAction::OutboundMarkFailed { id };

        let wrong = vec![
            // only NeedsManualCheck can be marked minted or retried
            minted(0),
            minted(1),
            minted(2),
            minted(4),
            retry(0),
            retry(1),
            retry(2),
            // only Quarantined can be minted elsewhere
            mint_to(0),
            mint_to(1),
            mint_to(3),
            // a mint in flight, a possible mint and a done mint are never rejected
            reject(1),
            reject(3),
            reject(4),
            // only an outbound NeedsManualCheck is resolved
            burned(0),
            burned(1),
            burned(2),
            failed(0),
            failed(1),
            failed(2),
            // unknown records
            minted(9),
            burned(9),
            ResolveAction::InboundRetry {
                token: None,
                chain: EvmChain::Ethereum,
                burn_id: 3,
            },
        ];
        let state_before = bridge();
        let records_before: Vec<_> = (0..5).map(inbound).collect();
        let queue_before = queued_keys();
        for action in wrong {
            assert!(
                resolve(vec![action.clone()]).is_err(),
                "{action:?} was accepted"
            );
            assert!(
                mutate_state(|s| apply_resolve(&mut s.data.bridge, &action)).is_err(),
                "{action:?} was applied"
            );
        }

        // one record twice in one proposal
        assert!(resolve(vec![retry(3), minted(3)])
            .unwrap_err()
            .contains("more than once"));
        assert!(resolve(vec![failed(3), failed(3)]).is_err());
        // a mark minted above bridged_out
        mutate_state(|s| s.data.bridge.bridged_out = 0);
        assert!(resolve(vec![minted(3)])
            .unwrap_err()
            .contains("bridged_out"));
        mutate_state(|s| s.data.bridge.bridged_out = state_before.bridged_out);
        // an empty list
        assert!(resolve(vec![]).is_err());

        assert_eq!(bridge(), state_before);
        assert_eq!((0..5).map(inbound).collect::<Vec<_>>(), records_before);
        assert_eq!(queued_keys(), queue_before);
        assert_eq!(
            outbound(3).status,
            OutboundStatus::NeedsManualCheck("x".into())
        );
    }

    #[test]
    fn checks_follow_the_counters_in_order() {
        // two marks that each fit bridged_out alone but not together
        setup(5 * ONE, 0);
        save(&[3 * ONE, 3 * ONE]);
        set_status(0, manual("x"));
        set_status(1, manual("x"));
        let both = vec![
            ResolveAction::InboundMarkMinted {
                token: None,
                chain: CHAIN,
                burn_id: 0,
                icp_block_index: 1,
            },
            ResolveAction::InboundMarkMinted {
                token: None,
                chain: CHAIN,
                burn_id: 1,
                icp_block_index: 2,
            },
        ];
        let err = read_state(|s| check_resolves(&s.data.bridge, &both)).unwrap_err();
        assert!(err.contains("bridged_out"), "{err}");

        // an outbound mark burned earlier in the list raises bridged_out for the next one
        setup(5 * ONE, ONE);
        save(&[3 * ONE, 3 * ONE]);
        set_status(0, manual("x"));
        set_status(1, manual("x"));
        put_outbound(0, ONE, OutboundStatus::NeedsManualCheck("x".into()));
        let mut ordered = vec![ResolveAction::OutboundMarkBurned {
            id: 0,
            icp_burn_index: 4,
        }];
        ordered.extend(both);
        assert!(resolve(ordered).is_ok());
        let state = bridge();
        assert_eq!(state.bridged_out, 0);
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.unminted_e8s, U256::ZERO);
    }
}
