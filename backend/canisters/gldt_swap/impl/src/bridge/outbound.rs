//! ICP to EVM (spec 8.6): `bridge_to_evm`, settling burns whose outcome is unknown, and
//! signing the claim vouchers users submit on Ethereum or Base.
//!
//! A transfer goes `Burning`, then `Burned`, then `Signed`. A burn whose outcome is unknown
//! is `BurnUnknown`; the processor retries it with byte-identical arguments (the same memo
//! and `created_at_time`), so the ledger answers `Duplicate` if an earlier call burned.
//!
//! `out_pending` and `bridged_out` move exactly once per transfer: a burn result is applied
//! only while the stored status is `Burning` or `BurnUnknown`, and a voucher is stored only
//! while the status is `Burned` with the same burn index. An [`OutboundGuard`] keeps the
//! user's call and the processor from awaiting the same transfer at once.

use crate::bridge::evm::address::{format_address, parse_address};
use crate::bridge::evm::eip712::claim_digest;
use crate::bridge::evm::num::nat_to_u256;
use crate::bridge::gldt_ledger;
use crate::bridge::signer::{sign_digest, SignerPath};
use crate::bridge::stable::with_outbound;
use crate::bridge::state::BridgeState;
use crate::guards::{BridgeCallerGuard, OutboundGuard};
use crate::state::{mutate_state, read_state};
use alloy_primitives::hex;
use candid::{Nat, Principal};
pub use gldt_swap_common::bridge::OutboundTransfer;
use gldt_swap_common::bridge::{
    BridgeError, BridgeToEvmArgs, EvmChain, EvmVoucher, OutboundStatus, Severity,
};
pub use icrc_ledger_canister::icrc2_transfer_from::Response as TransferFromResponse;
use icrc_ledger_canister_c2c_client::icrc2_transfer_from;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::Memo;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use tracing::{info, warn};
use utils::env::Environment;

/// The burn memo is these 8 bytes and the out id, big endian.
pub const OUT_MEMO_PREFIX: &[u8; 8] = b"GLDT-OUT";

/// The largest amount one transfer may burn, in e8s. Far above any GLDT balance, and small
/// enough that 100 concurrent reservations can never overflow `out_pending`.
pub const MAX_OUT_AMOUNT_E8S: u64 = u64::MAX;

/// `get_bridge_transfers_out_by_account` returns at most this many transfers per call.
pub const MAX_TRANSFERS_PER_PAGE: u32 = 100;

/// The ledger's answer to a burn, as [`apply_burn_result`] uses it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum BurnResult {
    /// Burned at this block index.
    Ok(u64),
    /// An earlier call with the same arguments burned at this block index.
    Duplicate(u64),
    /// The ledger refused, and no call with these arguments can have burned.
    Definite(TransferFromError),
    /// No answer that settles it: the same call is retried later.
    NoAnswer,
    /// The ledger's deduplication window passed while the outcome was unknown.
    TooOld,
}

/// The memo of outbound transfer `id`: `b"GLDT-OUT"` and `id` big endian, 16 bytes.
pub fn out_memo(id: u64) -> Memo {
    let mut memo = OUT_MEMO_PREFIX.to_vec();
    memo.extend_from_slice(&id.to_be_bytes());
    Memo::from(memo)
}

/// The synchronous part of `bridge_to_evm` (spec 8.6 steps 1 to 3): checks, then the id,
/// memo and `created_at_time` are fixed, `out_pending` is reserved and the transfer is stored
/// as `Burning`. Nothing changes when it returns an error.
pub fn begin_outbound(
    state: &mut BridgeState,
    caller: Principal,
    args: &BridgeToEvmArgs,
    now: u64,
) -> Result<OutboundTransfer, BridgeError> {
    if state.paused_out {
        return Err(BridgeError::Paused);
    }
    check_ready(state, args.chain)?;

    if state.chain_config(args.chain).is_none() {
        return Err(BridgeError::UnknownChain);
    }
    let recipient = parse_address(&args.recipient)
        .ok()
        .filter(|address| *address != [0u8; 20])
        .ok_or(BridgeError::InvalidRecipient)?;
    if args.amount == 0u8 {
        return Err(BridgeError::ZeroAmount);
    }
    let amount = u64::try_from(&args.amount.0).map_err(|_| {
        BridgeError::Burn(TransferFromError::GenericError {
            error_code: Nat::from(0u8),
            message: format!(
                "amount {} is above the largest amount the bridge accepts, {MAX_OUT_AMOUNT_E8S} e8s",
                args.amount
            ),
        })
    })?;

    let id = state.next_out_id;
    state.next_out_id = id
        .checked_add(1)
        .unwrap_or_else(|| panic!("next_out_id overflow at {id}"));
    state.add_out_pending(u128::from(amount));
    let record = OutboundTransfer {
        id,
        from: Account {
            owner: caller,
            subaccount: args.from_subaccount,
        },
        chain: args.chain,
        recipient: format_address(&recipient),
        amount: Nat::from(amount),
        created_at: now,
        status: OutboundStatus::Burning,
    };
    store_outbound(state, &record);
    Ok(record)
}

/// Spec 8.6 step 1: both signer keys are loaded, every configured chain has a start block,
/// and `chain` is not stopped.
fn check_ready(state: &BridgeState, chain: EvmChain) -> Result<(), BridgeError> {
    let config = state
        .config
        .as_ref()
        .ok_or_else(|| BridgeError::NotReady("the bridge is not configured".to_string()))?;
    if state.claims_signer.is_none() || state.admin_signer.is_none() {
        return Err(BridgeError::NotReady(
            "the signer keys are not loaded yet".to_string(),
        ));
    }
    for cfg in &config.chains {
        let started = state
            .chain_state(cfg.chain)
            .is_some_and(|c| c.start_block.is_some());
        if !started {
            return Err(BridgeError::NotReady(format!(
                "{:?} has no start block yet",
                cfg.chain
            )));
        }
    }
    if let Some(reason) = state.chain_state(chain).and_then(|c| c.stopped.as_ref()) {
        return Err(BridgeError::NotReady(format!(
            "{chain:?} is stopped: {reason}"
        )));
    }
    Ok(())
}

/// The burn: `icrc2_transfer_from` to the minting account `(minting_owner, None)`. Built only
/// from the stored record, so every retry sends byte-identical arguments.
pub fn burn_args(record: &OutboundTransfer, minting_owner: Principal) -> TransferFromArgs {
    TransferFromArgs {
        spender_subaccount: None,
        from: record.from,
        to: Account {
            owner: minting_owner,
            subaccount: None,
        },
        amount: record.amount.clone(),
        fee: None,
        memo: Some(out_memo(record.id)),
        created_at_time: Some(record.created_at),
    }
}

/// Reads the ledger's reply (`None` when the call got no reply). `retry` is true when an
/// earlier call with the same arguments may have burned.
///
/// The ledger checks its throttle, `TooOld` and `CreatedInFuture`, and `BadBurn` (which
/// depends on the balance) before its deduplication lookup. So on a retry only
/// `InsufficientFunds` and `InsufficientAllowance` prove nothing burned; every other refusal
/// leaves the outcome unknown. On the first call nothing can have burned, so every refusal is
/// final.
pub fn classify_burn(reply: Option<TransferFromResponse>, retry: bool) -> BurnResult {
    use TransferFromError as E;
    match reply {
        None => BurnResult::NoAnswer,
        Some(TransferFromResponse::Ok(index)) => {
            block_index(&index).map_or(BurnResult::NoAnswer, BurnResult::Ok)
        }
        Some(TransferFromResponse::Err(E::Duplicate { duplicate_of })) => {
            block_index(&duplicate_of).map_or(BurnResult::NoAnswer, BurnResult::Duplicate)
        }
        Some(TransferFromResponse::Err(e)) if !retry => BurnResult::Definite(e),
        Some(TransferFromResponse::Err(E::TooOld)) => BurnResult::TooOld,
        Some(TransferFromResponse::Err(
            e @ (E::InsufficientFunds { .. } | E::InsufficientAllowance { .. }),
        )) => BurnResult::Definite(e),
        Some(TransferFromResponse::Err(_)) => BurnResult::NoAnswer,
    }
}

fn block_index(n: &Nat) -> Option<u64> {
    u64::try_from(&n.0).ok()
}

/// Spec 8.6 step 4. Applies a burn result to a transfer that is `Burning` or `BurnUnknown`
/// and returns the updated transfer. Any other status is left alone (`None`), so a late or
/// repeated answer can never move the counters twice.
pub fn apply_burn_result(
    state: &mut BridgeState,
    id: u64,
    result: BurnResult,
    now: u64,
) -> Option<OutboundTransfer> {
    let mut record = with_outbound(|m| m.get(&id))?;
    if !matches!(
        record.status,
        OutboundStatus::Burning | OutboundStatus::BurnUnknown
    ) {
        info!(id, status = ?record.status, ?result, "outbound burn result ignored, already settled");
        return None;
    }
    let amount = amount_e8s(&record);
    record.status = match result {
        BurnResult::Ok(index) | BurnResult::Duplicate(index) => {
            state.sub_out_pending(amount);
            state.add_bridged_out(amount);
            OutboundStatus::Burned {
                icp_burn_index: index,
            }
        }
        BurnResult::Definite(e) => {
            state.sub_out_pending(amount);
            OutboundStatus::Failed(format!("the ledger refused the burn: {e}"))
        }
        BurnResult::NoAnswer => OutboundStatus::BurnUnknown,
        BurnResult::TooOld => {
            // never undone here: the burn may have happened
            let reason = format!(
                "the ledger's deduplication window passed before the burn outcome was known; \
                 look for memo GLDT-OUT {id} from {} in the ledger, then resolve by SNS",
                record.from
            );
            state.push_alert(
                now,
                Severity::Critical,
                format!("outbound {id} needs a manual check: {reason}"),
            );
            OutboundStatus::NeedsManualCheck(reason)
        }
    };
    store_outbound(state, &record);
    Some(record)
}

/// Stores `record` in the outbound map and keeps `outbound_work` in step with its status.
/// Every status change goes through here.
pub fn store_outbound(state: &mut BridgeState, record: &OutboundTransfer) {
    if needs_work(&record.status) {
        state.outbound_work.insert(record.id);
    } else {
        state.outbound_work.remove(&record.id);
    }
    with_outbound(|m| m.insert(record.id, record.clone()));
}

fn needs_work(status: &OutboundStatus) -> bool {
    matches!(
        status,
        OutboundStatus::Burning | OutboundStatus::BurnUnknown | OutboundStatus::Burned { .. }
    )
}

/// The amount in e8s; `begin_outbound` stores only amounts up to [`MAX_OUT_AMOUNT_E8S`].
fn amount_e8s(record: &OutboundTransfer) -> u128 {
    u128::try_from(&record.amount.0).unwrap_or_else(|_| {
        panic!(
            "outbound {} amount {} does not fit u128",
            record.id, record.amount
        )
    })
}

/// The voucher of a `Burned` transfer, without its signature, and the EIP-712 digest the
/// claims key signs. The chain id and token come from the config at signing time.
pub fn voucher_request(state: &BridgeState, id: u64) -> Result<(EvmVoucher, [u8; 32]), String> {
    let record = with_outbound(|m| m.get(&id)).ok_or_else(|| format!("no outbound {id}"))?;
    let OutboundStatus::Burned { icp_burn_index } = record.status else {
        return Err(format!("outbound {id} is {:?}, not Burned", record.status));
    };
    let cfg = state
        .chain_config(record.chain)
        .ok_or_else(|| format!("{:?} is not configured", record.chain))?;
    let token = parse_address(&cfg.token)?;
    let recipient = parse_address(&record.recipient)?;
    let amount = nat_to_u256(&record.amount)
        .ok_or_else(|| format!("outbound {id} amount does not fit 256 bits"))?;
    let digest = claim_digest(cfg.chain_id, token, icp_burn_index, recipient, amount);
    let voucher = EvmVoucher {
        chain_id: cfg.chain_id,
        token: format_address(&token),
        icp_burn_index,
        recipient: record.recipient,
        amount: record.amount,
        signature: String::new(),
    };
    Ok((voucher, digest))
}

/// The voucher with its signature as `0x` and 65 bytes of hex (`r || s || v`).
pub fn with_signature(voucher: EvmVoucher, signature: [u8; 65]) -> EvmVoucher {
    EvmVoucher {
        signature: format!("0x{}", hex::encode(signature)),
        ..voucher
    }
}

/// Stores the signed voucher if the transfer is still `Burned` at the voucher's burn index.
pub fn store_voucher(state: &mut BridgeState, id: u64, voucher: EvmVoucher) -> bool {
    let Some(mut record) = with_outbound(|m| m.get(&id)) else {
        return false;
    };
    if record.status
        != (OutboundStatus::Burned {
            icp_burn_index: voucher.icp_burn_index,
        })
    {
        info!(id, status = ?record.status, "outbound voucher not stored, status changed");
        return false;
    }
    record.status = OutboundStatus::Signed(voucher);
    store_outbound(state, &record);
    true
}

pub fn transfer_out(id: u64) -> Option<OutboundTransfer> {
    with_outbound(|m| m.get(&id))
}

/// `account`'s transfers, newest first. `start` is an exclusive upper bound on the id (pass
/// the last id of the previous page); `None` starts at the newest. At most
/// [`MAX_TRANSFERS_PER_PAGE`] are returned.
pub fn transfers_out_by_account(
    account: &Account,
    start: Option<u64>,
    limit: u32,
) -> Vec<OutboundTransfer> {
    let limit = limit.min(MAX_TRANSFERS_PER_PAGE) as usize;
    if limit == 0 {
        return Vec::new();
    }
    with_outbound(|m| {
        let range = match start {
            Some(start) => m.range(..start),
            None => m.range(..),
        };
        range
            .rev()
            .map(|entry| entry.value())
            .filter(|t| t.from == *account)
            .take(limit)
            .collect()
    })
}

/// `bridge_to_evm` (spec 8.6). Returns the transfer as it stands: `Signed` normally,
/// `BurnUnknown` or `Burned` when the processor finishes it later, or the ledger's refusal.
pub async fn bridge_to_evm_impl(args: BridgeToEvmArgs) -> Result<OutboundTransfer, BridgeError> {
    let caller = read_state(|s| s.env.caller());
    // held until the transfer is answered and signed, also across a trap
    let _caller_guard = BridgeCallerGuard::new(caller)?;

    let (record, ledger, minting_owner) = mutate_state(|s| {
        let ledger = gldt_ledger(&s.data.swap_configs).map_err(BridgeError::NotReady)?;
        let now = s.env.now_nanos();
        let record = begin_outbound(&mut s.data.bridge, caller, &args, now)?;
        Ok::<_, BridgeError>((record, ledger, s.env.canister_id()))
    })?;
    // the id is new, so nothing else holds it; without the guard the processor finishes it
    let Some(_in_flight) = OutboundGuard::new(record.id) else {
        return Ok(record);
    };

    let result = burn(ledger, &record, minting_owner, false).await;
    let refusal = match &result {
        BurnResult::Definite(e) => Some(e.clone()),
        _ => None,
    };
    mutate_state(|s| {
        let now = s.env.now_nanos();
        apply_burn_result(&mut s.data.bridge, record.id, result, now)
    });
    if let Some(e) = refusal {
        return Err(BridgeError::Burn(e));
    }

    if matches!(
        transfer_out(record.id).map(|t| t.status),
        Some(OutboundStatus::Burned { .. })
    ) {
        sign_voucher(record.id).await;
    }
    Ok(transfer_out(record.id).unwrap_or(record))
}

/// Sends the burn once and reads the answer.
async fn burn(
    ledger: Principal,
    record: &OutboundTransfer,
    minting_owner: Principal,
    retry: bool,
) -> BurnResult {
    let reply = icrc2_transfer_from(ledger, burn_args(record, minting_owner))
        .await
        .map_err(|e| warn!(id = record.id, error = ?e, "outbound burn got no reply"))
        .ok();
    #[cfg(feature = "inttest")]
    let reply = if crate::bridge::test_hooks::take_lost_reply(
        crate::bridge::test_hooks::LedgerCall::Burn,
    ) {
        warn!(
            id = record.id,
            ?reply,
            "outbound burn answer dropped by the test hook"
        );
        None
    } else {
        reply
    };
    let result = classify_burn(reply, retry);
    info!(id = record.id, retry, ?result, "outbound burn answered");
    result
}

/// Signs the voucher of a `Burned` transfer with the claims key and stores it. On failure the
/// transfer stays `Burned` and the processor tries again.
async fn sign_voucher(id: u64) {
    let (voucher, digest) = match read_state(|s| voucher_request(&s.data.bridge, id)) {
        Ok(request) => request,
        Err(e) => {
            warn!(id, error = %e, "outbound voucher not signed");
            return;
        }
    };
    match sign_digest(SignerPath::Claims, digest).await {
        Ok(signature) => {
            let stored = mutate_state(|s| {
                store_voucher(&mut s.data.bridge, id, with_signature(voucher, signature))
            });
            info!(id, stored, "outbound voucher signed");
        }
        Err(e) => warn!(id, error = %e, "outbound voucher signing failed, retried later"),
    }
}

/// The outbound half of `bridge_process`: retries every burn whose outcome is unknown with
/// the stored arguments, and signs every `Burned` transfer. It runs while paused too (spec
/// 8.10): these users already started or paid.
///
/// A `Burning` transfer that no call holds is retried like `BurnUnknown`: its first call
/// ended without applying an answer (a trap after the await), so it may have burned.
pub async fn process_outbound() {
    let ids: Vec<u64> = read_state(|s| s.data.bridge.outbound_work.iter().copied().collect());
    for id in ids {
        // `bridge_to_evm` or an overlapping run is still awaiting this transfer
        let Some(_in_flight) = OutboundGuard::new(id) else {
            continue;
        };
        let Some(record) = transfer_out(id) else {
            continue;
        };
        if matches!(
            record.status,
            OutboundStatus::Burning | OutboundStatus::BurnUnknown
        ) {
            let (ledger, minting_owner) =
                read_state(|s| (gldt_ledger(&s.data.swap_configs), s.env.canister_id()));
            let ledger = match ledger {
                Ok(ledger) => ledger,
                Err(e) => {
                    warn!(id, error = %e, "outbound burn not retried");
                    continue;
                }
            };
            let result = burn(ledger, &record, minting_owner, true).await;
            mutate_state(|s| {
                let now = s.env.now_nanos();
                apply_burn_result(&mut s.data.bridge, id, result, now)
            });
        }
        let burned = matches!(
            transfer_out(id).map(|t| t.status),
            Some(OutboundStatus::Burned { .. })
        );
        if burned && read_state(|s| s.data.bridge.claims_signer.is_some()) {
            sign_voucher(id).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::configured_state;
    use crate::bridge::evm::address::{evm_address, parse_address};
    use crate::bridge::evm::eip712::claim_digest;
    use crate::bridge::evm::vectors::{public_key, recover, signing_key, to_bytes64};
    use crate::bridge::signer::normalize_signature;
    use crate::bridge::state::EvmSigner;
    use alloy_primitives::U256;
    use candid::{Encode, Nat, Principal};
    use gldt_swap_common::bridge::{BridgeError, BridgeToEvmArgs, EvmChain, OutboundStatus};
    use icrc_ledger_types::icrc1::account::Account;
    use icrc_ledger_types::icrc1::transfer::Memo;
    use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};

    const NOW: u64 = 1_762_000_000_000_000_000;
    const RECIPIENT: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const AMOUNT: u64 = 1_250_000_000;

    fn user() -> Principal {
        Principal::from_slice(&[7; 29])
    }

    fn minting_owner() -> Principal {
        Principal::from_slice(&[0x5f; 10])
    }

    fn signer() -> EvmSigner {
        let public_key = public_key(&signing_key());
        EvmSigner {
            address: evm_address(&public_key),
            public_key,
        }
    }

    /// Configured, both signers loaded, and every chain open.
    fn ready_state() -> BridgeState {
        let mut state = configured_state();
        state.claims_signer = Some(signer());
        state.admin_signer = Some(signer());
        for chain in [EvmChain::Ethereum, EvmChain::Base] {
            state.chain_state_mut(chain).unwrap().start_block = Some(100);
        }
        state
    }

    fn args(chain: EvmChain, recipient: &str, amount: impl Into<Nat>) -> BridgeToEvmArgs {
        BridgeToEvmArgs {
            chain,
            recipient: recipient.to_string(),
            amount: amount.into(),
            from_subaccount: None,
        }
    }

    fn base_args() -> BridgeToEvmArgs {
        args(EvmChain::Base, RECIPIENT, AMOUNT)
    }

    fn begin(state: &mut BridgeState, args: &BridgeToEvmArgs) -> OutboundTransfer {
        begin_outbound(state, user(), args, NOW).expect("begin_outbound")
    }

    fn assert_nothing_reserved(state: &BridgeState) {
        assert_eq!(state.next_out_id, 0);
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.bridged_out, 0);
        assert!(state.outbound_work.is_empty());
        assert_eq!(with_outbound(|m| m.len()), 0);
    }

    fn status(id: u64) -> OutboundStatus {
        transfer_out(id).expect("stored transfer").status
    }

    #[test]
    fn not_ready_until_every_chain_has_start_block() {
        let mut unconfigured = BridgeState::default();
        assert!(matches!(
            begin_outbound(&mut unconfigured, user(), &base_args(), NOW),
            Err(BridgeError::NotReady(_))
        ));

        let mut no_signers = ready_state();
        no_signers.claims_signer = None;
        assert!(matches!(
            begin_outbound(&mut no_signers, user(), &base_args(), NOW),
            Err(BridgeError::NotReady(m)) if m.contains("signer")
        ));
        let mut no_admin = ready_state();
        no_admin.admin_signer = None;
        assert!(matches!(
            begin_outbound(&mut no_admin, user(), &base_args(), NOW),
            Err(BridgeError::NotReady(m)) if m.contains("signer")
        ));

        // Base is not open yet, so neither chain takes transfers
        let mut state = ready_state();
        state.chain_state_mut(EvmChain::Base).unwrap().start_block = None;
        for chain in [EvmChain::Ethereum, EvmChain::Base] {
            assert!(matches!(
                begin_outbound(&mut state, user(), &args(chain, RECIPIENT, AMOUNT), NOW),
                Err(BridgeError::NotReady(m)) if m.contains("Base") && m.contains("start block")
            ));
        }
        assert_nothing_reserved(&state);

        state.chain_state_mut(EvmChain::Base).unwrap().start_block = Some(7);
        assert!(begin_outbound(&mut state, user(), &base_args(), NOW).is_ok());
    }

    #[test]
    fn not_ready_when_target_chain_is_stopped() {
        let mut state = ready_state();
        state.chain_state_mut(EvmChain::Base).unwrap().stopped = Some("deep reorg".to_string());
        assert!(matches!(
            begin_outbound(&mut state, user(), &base_args(), NOW),
            Err(BridgeError::NotReady(m)) if m.contains("stopped") && m.contains("deep reorg")
        ));
        assert_nothing_reserved(&state);

        // the other chain keeps working
        let transfer = begin(&mut state, &args(EvmChain::Ethereum, RECIPIENT, AMOUNT));
        assert_eq!(transfer.chain, EvmChain::Ethereum);
    }

    #[test]
    fn paused_out_rejects() {
        let mut state = ready_state();
        state.paused_out = true;
        assert_eq!(
            begin_outbound(&mut state, user(), &base_args(), NOW),
            Err(BridgeError::Paused)
        );
        // paused wins over not ready
        state.claims_signer = None;
        assert_eq!(
            begin_outbound(&mut state, user(), &base_args(), NOW),
            Err(BridgeError::Paused)
        );
        assert_nothing_reserved(&state);

        // the inbound pause does not stop outbound
        let mut state = ready_state();
        state.paused_in = true;
        assert!(begin_outbound(&mut state, user(), &base_args(), NOW).is_ok());
    }

    #[test]
    fn zero_amount_and_bad_recipient_rejected() {
        let mut state = ready_state();
        assert_eq!(
            begin_outbound(
                &mut state,
                user(),
                &args(EvmChain::Base, RECIPIENT, 0u64),
                NOW
            ),
            Err(BridgeError::ZeroAmount)
        );

        let zero = format!("0x{}", "0".repeat(40));
        let nineteen_bytes = format!("0x{}", "ab".repeat(19));
        let twenty_one_bytes = format!("0x{}", "ab".repeat(21));
        let no_prefix = RECIPIENT[2..].to_string();
        // one letter of the checksummed address flipped to lower case
        let bad_checksum = "0x70997970c51812dc3A010C7d01b50e0d17dc79C8".to_string();
        let not_hex = format!("0x{}", "zz".repeat(20));
        for bad in [
            zero,
            nineteen_bytes,
            twenty_one_bytes,
            no_prefix,
            bad_checksum,
            not_hex,
            String::new(),
        ] {
            assert_eq!(
                begin_outbound(&mut state, user(), &args(EvmChain::Base, &bad, AMOUNT), NOW),
                Err(BridgeError::InvalidRecipient),
                "recipient {bad:?}"
            );
        }

        // above the largest amount the bridge accepts
        let too_big = Nat::from(u64::MAX) + Nat::from(1u8);
        assert!(matches!(
            begin_outbound(
                &mut state,
                user(),
                &args(EvmChain::Base, RECIPIENT, too_big),
                NOW
            ),
            Err(BridgeError::Burn(TransferFromError::GenericError { .. }))
        ));
        assert_nothing_reserved(&state);

        // a chain that is not configured
        let mut eth_only = ready_state();
        eth_only
            .config
            .as_mut()
            .unwrap()
            .chains
            .retain(|c| c.chain == EvmChain::Ethereum);
        assert_eq!(
            begin_outbound(&mut eth_only, user(), &base_args(), NOW),
            Err(BridgeError::UnknownChain)
        );
        assert_nothing_reserved(&eth_only);

        // the largest accepted amount is reserved in full
        let max = begin(&mut state, &args(EvmChain::Base, RECIPIENT, u64::MAX));
        assert_eq!(max.amount, Nat::from(u64::MAX));
        assert_eq!(state.out_pending, u64::MAX as u128);
    }

    #[test]
    fn begin_outbound_reserves_out_pending_and_fixes_memo_and_time() {
        let mut state = ready_state();
        let subaccount = [3u8; 32];
        // lower case is accepted and stored as EIP-55
        let mut first_args = args(EvmChain::Base, &RECIPIENT.to_lowercase(), AMOUNT);
        first_args.from_subaccount = Some(subaccount);

        let first = begin(&mut state, &first_args);
        assert_eq!(
            first,
            OutboundTransfer {
                id: 0,
                from: Account {
                    owner: user(),
                    subaccount: Some(subaccount),
                },
                chain: EvmChain::Base,
                recipient: RECIPIENT.to_string(),
                amount: Nat::from(AMOUNT),
                created_at: NOW,
                status: OutboundStatus::Burning,
            }
        );
        assert_eq!(state.out_pending, AMOUNT as u128);
        assert_eq!(state.bridged_out, 0);
        assert_eq!(state.next_out_id, 1);
        assert_eq!(transfer_out(0), Some(first.clone()));
        assert!(state.outbound_work.contains(&0));

        let second = begin_outbound(
            &mut state,
            user(),
            &args(EvmChain::Ethereum, RECIPIENT, 7u64),
            NOW + 5,
        )
        .unwrap();
        assert_eq!(second.id, 1);
        assert_eq!(second.created_at, NOW + 5);
        assert_eq!(state.out_pending, AMOUNT as u128 + 7);

        let mut memo = b"GLDT-OUT".to_vec();
        memo.extend_from_slice(&0u64.to_be_bytes());
        let burn = burn_args(&first, minting_owner());
        assert_eq!(
            burn,
            TransferFromArgs {
                spender_subaccount: None,
                from: Account {
                    owner: user(),
                    subaccount: Some(subaccount),
                },
                to: Account {
                    owner: minting_owner(),
                    subaccount: None,
                },
                amount: Nat::from(AMOUNT),
                fee: None,
                memo: Some(Memo::from(memo)),
                created_at_time: Some(NOW),
            }
        );
        assert_eq!(
            burn_args(&second, minting_owner()).memo,
            Some(Memo::from(b"GLDT-OUT\0\0\0\0\0\0\0\x01".to_vec()))
        );
        assert_eq!(
            burn_args(&second, minting_owner()).created_at_time,
            Some(NOW + 5)
        );

        // a retry rebuilds byte-identical arguments from the stored record
        let stored = transfer_out(0).unwrap();
        assert_eq!(
            Encode!(&burn_args(&stored, minting_owner())).unwrap(),
            Encode!(&burn).unwrap()
        );
    }

    #[test]
    fn ok_and_duplicate_move_amount_to_bridged_out_once() {
        let mut state = ready_state();
        let a = begin(&mut state, &base_args());
        let b = begin(&mut state, &args(EvmChain::Ethereum, RECIPIENT, 300u64));

        let after = apply_burn_result(&mut state, a.id, BurnResult::Ok(41), NOW).unwrap();
        assert_eq!(after.status, OutboundStatus::Burned { icp_burn_index: 41 });
        assert_eq!(status(a.id), OutboundStatus::Burned { icp_burn_index: 41 });
        assert_eq!(state.out_pending, 300);
        assert_eq!(state.bridged_out, AMOUNT as u128);

        // late or repeated answers for the same burn change nothing
        for late in [
            BurnResult::Ok(41),
            BurnResult::Duplicate(41),
            BurnResult::NoAnswer,
            BurnResult::TooOld,
            BurnResult::Definite(TransferFromError::TemporarilyUnavailable),
        ] {
            assert_eq!(apply_burn_result(&mut state, a.id, late, NOW), None);
        }
        assert_eq!(status(a.id), OutboundStatus::Burned { icp_burn_index: 41 });
        assert_eq!(state.out_pending, 300);
        assert_eq!(state.bridged_out, AMOUNT as u128);

        // a retry after an unknown outcome finds the earlier burn
        apply_burn_result(&mut state, b.id, BurnResult::NoAnswer, NOW).unwrap();
        let after = apply_burn_result(&mut state, b.id, BurnResult::Duplicate(42), NOW).unwrap();
        assert_eq!(after.status, OutboundStatus::Burned { icp_burn_index: 42 });
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.bridged_out, AMOUNT as u128 + 300);
        assert_eq!(
            apply_burn_result(&mut state, b.id, BurnResult::Ok(42), NOW),
            None
        );
        assert_eq!(state.bridged_out, AMOUNT as u128 + 300);

        // both still need a voucher
        assert_eq!(
            state.outbound_work.iter().copied().collect::<Vec<_>>(),
            [0, 1]
        );
        // an unknown id changes nothing
        assert_eq!(
            apply_burn_result(&mut state, 99, BurnResult::Ok(1), NOW),
            None
        );
    }

    #[test]
    fn definite_error_releases_out_pending_and_fails() {
        let mut state = ready_state();
        let a = begin(&mut state, &base_args());
        let refusal = TransferFromError::InsufficientAllowance {
            allowance: Nat::from(5u8),
        };
        let after =
            apply_burn_result(&mut state, a.id, BurnResult::Definite(refusal), NOW).unwrap();
        assert!(
            matches!(&after.status, OutboundStatus::Failed(m) if m.contains("allowance")),
            "{:?}",
            after.status
        );
        assert_eq!(status(a.id), after.status);
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.bridged_out, 0);
        assert!(state.outbound_work.is_empty());

        // a late answer cannot revive it
        assert_eq!(
            apply_burn_result(&mut state, a.id, BurnResult::Ok(3), NOW),
            None
        );
        assert_eq!(state.bridged_out, 0);

        // a definite refusal on a retry after an unknown outcome fails it too
        let b = begin(&mut state, &base_args());
        apply_burn_result(&mut state, b.id, BurnResult::NoAnswer, NOW).unwrap();
        let refusal = TransferFromError::InsufficientFunds {
            balance: Nat::from(0u8),
        };
        let after =
            apply_burn_result(&mut state, b.id, BurnResult::Definite(refusal), NOW).unwrap();
        assert!(matches!(after.status, OutboundStatus::Failed(_)));
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.bridged_out, 0);
        assert!(state.outbound_work.is_empty());
    }

    #[test]
    fn no_answer_marks_burn_unknown_and_keeps_out_pending() {
        let mut state = ready_state();
        let a = begin(&mut state, &base_args());
        let after = apply_burn_result(&mut state, a.id, BurnResult::NoAnswer, NOW).unwrap();
        assert_eq!(after.status, OutboundStatus::BurnUnknown);
        assert_eq!(status(a.id), OutboundStatus::BurnUnknown);
        assert_eq!(state.out_pending, AMOUNT as u128);
        assert_eq!(state.bridged_out, 0);
        assert!(state.outbound_work.contains(&a.id));

        // another retry without an answer keeps it reserved
        let again = apply_burn_result(&mut state, a.id, BurnResult::NoAnswer, NOW).unwrap();
        assert_eq!(again.status, OutboundStatus::BurnUnknown);
        assert_eq!(state.out_pending, AMOUNT as u128);
        assert_eq!(state.bridged_out, 0);
        assert!(state.outbound_work.contains(&a.id));
    }

    #[test]
    fn too_old_marks_needs_manual_check_and_keeps_out_pending() {
        let mut state = ready_state();
        let a = begin(&mut state, &base_args());
        apply_burn_result(&mut state, a.id, BurnResult::NoAnswer, NOW).unwrap();
        let alerts_before = state.alerts_total;

        let after = apply_burn_result(&mut state, a.id, BurnResult::TooOld, NOW + 1).unwrap();
        assert!(matches!(
            &after.status,
            OutboundStatus::NeedsManualCheck(m) if m.contains("GLDT-OUT")
        ));
        assert_eq!(status(a.id), after.status);
        // never undone here: the burn may have happened
        assert_eq!(state.out_pending, AMOUNT as u128);
        assert_eq!(state.bridged_out, 0);
        // the processor has nothing left to do; an SNS resolve settles it
        assert!(state.outbound_work.is_empty());
        assert_eq!(state.alerts_total, alerts_before + 1);
        let alert = state.alerts.back().unwrap();
        assert_eq!(alert.time, NOW + 1);
        assert!(alert.message.contains("outbound 0"), "{}", alert.message);

        // a late answer changes nothing
        assert_eq!(
            apply_burn_result(&mut state, a.id, BurnResult::Ok(9), NOW),
            None
        );
        assert_eq!(state.out_pending, AMOUNT as u128);
        assert_eq!(state.bridged_out, 0);
    }

    #[test]
    fn classify_burn_trusts_only_answers_that_prove_the_outcome() {
        use TransferFromError as E;
        let ok = |n: Nat| Some(TransferFromResponse::Ok(n));
        let err = |e: E| Some(TransferFromResponse::Err(e));
        let all_refusals = || {
            [
                E::BadFee {
                    expected_fee: Nat::from(0u8),
                },
                E::BadBurn {
                    min_burn_amount: Nat::from(10u8),
                },
                E::InsufficientFunds {
                    balance: Nat::from(1u8),
                },
                E::InsufficientAllowance {
                    allowance: Nat::from(2u8),
                },
                E::TooOld,
                E::CreatedInFuture { ledger_time: 3 },
                E::TemporarilyUnavailable,
                E::GenericError {
                    error_code: Nat::from(4u8),
                    message: "no".to_string(),
                },
            ]
        };

        for retry in [false, true] {
            assert_eq!(classify_burn(None, retry), BurnResult::NoAnswer);
            assert_eq!(classify_burn(ok(Nat::from(5u8)), retry), BurnResult::Ok(5));
            assert_eq!(
                classify_burn(
                    err(E::Duplicate {
                        duplicate_of: Nat::from(6u8)
                    }),
                    retry
                ),
                BurnResult::Duplicate(6)
            );
            // a block index that does not fit u64 is not a usable answer
            let huge = Nat::from(u64::MAX) + Nat::from(1u8);
            assert_eq!(classify_burn(ok(huge.clone()), retry), BurnResult::NoAnswer);
            assert_eq!(
                classify_burn(err(E::Duplicate { duplicate_of: huge }), retry),
                BurnResult::NoAnswer
            );
        }

        // the first call is the only one with these arguments, so every refusal is final
        for e in all_refusals() {
            assert_eq!(
                classify_burn(err(e.clone()), false),
                BurnResult::Definite(e)
            );
        }

        // on a retry only the checks after the ledger's dedup lookup prove nothing burned
        for e in all_refusals() {
            let expected = match e {
                E::InsufficientFunds { .. } | E::InsufficientAllowance { .. } => {
                    BurnResult::Definite(e.clone())
                }
                E::TooOld => BurnResult::TooOld,
                _ => BurnResult::NoAnswer,
            };
            assert_eq!(classify_burn(err(e.clone()), true), expected, "{e:?}");
        }
    }

    #[test]
    fn voucher_is_built_from_the_burn_and_stored_once() {
        let mut state = ready_state();
        let a = begin(&mut state, &base_args());

        // nothing to sign before the burn is confirmed
        assert!(voucher_request(&state, a.id).is_err());
        apply_burn_result(&mut state, a.id, BurnResult::NoAnswer, NOW).unwrap();
        assert!(voucher_request(&state, a.id).is_err());
        apply_burn_result(&mut state, a.id, BurnResult::Ok(77), NOW).unwrap();

        let (voucher, digest) = voucher_request(&state, a.id).unwrap();
        let cfg = state.chain_config(EvmChain::Base).unwrap().clone();
        let token = parse_address(&cfg.token).unwrap();
        assert_eq!(
            digest,
            claim_digest(
                cfg.chain_id,
                token,
                77,
                parse_address(RECIPIENT).unwrap(),
                U256::from(AMOUNT)
            )
        );
        assert_eq!(voucher.chain_id, 8453);
        assert_eq!(
            voucher.token,
            crate::bridge::evm::address::format_address(&token)
        );
        assert_eq!(voucher.icp_burn_index, 77);
        assert_eq!(voucher.recipient, RECIPIENT);
        assert_eq!(voucher.amount, Nat::from(AMOUNT));
        assert!(voucher.signature.is_empty());

        // signed the way the canister signs: an ECDSA signature, then normalized
        let key = signing_key();
        let (sig, _) = key.sign_prehash_recoverable(&digest).unwrap();
        let sig65 = normalize_signature(to_bytes64(&sig), digest, &public_key(&key)).unwrap();
        let signed = with_signature(voucher.clone(), sig65);
        assert!(signed.signature.starts_with("0x"));
        assert_eq!(signed.signature.len(), 2 + 65 * 2);
        assert_eq!(recover(digest, &signed.signature), signer().address);

        assert!(store_voucher(&mut state, a.id, signed.clone()));
        assert_eq!(status(a.id), OutboundStatus::Signed(signed.clone()));
        assert!(state.outbound_work.is_empty());
        // counters are untouched by signing
        assert_eq!(state.out_pending, 0);
        assert_eq!(state.bridged_out, AMOUNT as u128);

        // a second signature is not stored, and a signed transfer needs no new one
        let mut other = signed.clone();
        other.signature = format!("0x{}", "11".repeat(65));
        assert!(!store_voucher(&mut state, a.id, other));
        assert_eq!(status(a.id), OutboundStatus::Signed(signed));
        assert!(voucher_request(&state, a.id).is_err());

        // a voucher for another burn index is not stored
        let b = begin(&mut state, &base_args());
        apply_burn_result(&mut state, b.id, BurnResult::Ok(78), NOW).unwrap();
        let (mut wrong, _) = voucher_request(&state, b.id).unwrap();
        wrong.icp_burn_index = 79;
        assert!(!store_voucher(
            &mut state,
            b.id,
            with_signature(wrong, sig65)
        ));
        assert_eq!(status(b.id), OutboundStatus::Burned { icp_burn_index: 78 });

        // without the chain in the config there is nothing to sign for; it stays Burned
        state
            .config
            .as_mut()
            .unwrap()
            .chains
            .retain(|c| c.chain == EvmChain::Ethereum);
        assert!(voucher_request(&state, b.id).is_err());
        assert!(state.outbound_work.contains(&b.id));
    }

    #[test]
    fn transfers_out_by_account_pages_newest_first() {
        let mut state = ready_state();
        let alice = user();
        let bob = Principal::from_slice(&[8; 29]);
        let mut with_from = |owner: Principal, subaccount: Option<[u8; 32]>| {
            let mut a = base_args();
            a.from_subaccount = subaccount;
            begin_outbound(&mut state, owner, &a, NOW).unwrap().id
        };
        let ids = [
            with_from(alice, None),
            with_from(bob, None),
            with_from(alice, Some([1; 32])),
            // the zero subaccount is the default account
            with_from(alice, Some([0; 32])),
            with_from(alice, None),
        ];
        assert_eq!(ids, [0, 1, 2, 3, 4]);

        let page = |account: Account, start: Option<u64>, limit: u32| -> Vec<u64> {
            transfers_out_by_account(&account, start, limit)
                .into_iter()
                .map(|t| t.id)
                .collect()
        };
        let alice_default = Account::from(alice);
        assert_eq!(page(alice_default, None, 10), [4, 3, 0]);
        assert_eq!(page(alice_default, Some(4), 10), [3, 0]);
        assert_eq!(page(alice_default, Some(3), 1), [0]);
        assert_eq!(page(alice_default, None, 1), [4]);
        assert_eq!(page(alice_default, None, 0), Vec::<u64>::new());
        assert_eq!(page(alice_default, Some(0), 10), Vec::<u64>::new());
        assert_eq!(
            page(
                Account {
                    owner: alice,
                    subaccount: Some([1; 32])
                },
                None,
                10
            ),
            [2]
        );
        assert_eq!(page(Account::from(bob), None, 10), [1]);

        // the page size is capped
        for _ in 0..MAX_TRANSFERS_PER_PAGE + 5 {
            begin_outbound(&mut state, bob, &base_args(), NOW).unwrap();
        }
        assert_eq!(
            transfers_out_by_account(&Account::from(bob), None, u32::MAX).len(),
            MAX_TRANSFERS_PER_PAGE as usize
        );
    }
}
