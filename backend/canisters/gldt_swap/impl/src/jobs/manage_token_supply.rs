//! The supply balancer, every 6 hours: GLDT on ICP should be the gold the canister
//! holds, times 100, less what is bridged out to Ethereum and Base. Ledger fees burn a little
//! GLDT, and the balancer mints that dust back to the fee account, at most 100 GLDT a run.
//!
//! A run holds the `Balancer` job guard, released on drop on every path. It skips while a swap
//! is active, and when a swap started or was still active across its reads: between a swap's
//! NFT move and its mint or burn, the shortfall it sees is not real.

use crate::bridge::gldt_ledger;
use crate::guards::{Job, JobGuard};
use crate::model::nft_manager::NftCollector;
use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::{run_interval, timestamp_nanos};
use candid::{Nat, Principal};
use futures::future::join_all;
use gldt_swap_common::bridge::Severity;
use gldt_swap_common::{gldt::GLDT_LEDGER_FEE_ACCOUNT, swap::MANAGE_GLDT_SUPPLY_INTERVAL};
use ic_stable_structures::Storable;
use icrc_ledger_canister_c2c_client::{icrc1_total_supply, icrc1_transfer};
use icrc_ledger_types::icrc1::{
    account::Account,
    transfer::{Memo, TransferArg},
};
use std::collections::HashMap;
use std::time::Duration;
use tracing::{error, info};
use utils::env::Environment;

/// A run mints at most 100 GLDT. The largest refill so far was 26.2.
pub const MAX_BALANCER_MINT_E8S: u64 = 10_000_000_000;

pub fn start_job() {
    run_interval(
        Duration::from_millis(MANAGE_GLDT_SUPPLY_INTERVAL),
        spawn_gldt_supply_balancer,
    );
}

/// Starts a run. It does nothing while another run holds the job guard.
pub fn spawn_gldt_supply_balancer() {
    ic_cdk::futures::spawn(balance_supply());
}

/// The GLDT the ICP ledger should hold: `expected` (the gold) less the larger of the two reads
/// of `bridged_out + out_pending`, never below zero. A transfer in progress across the reads can
/// then only make the balancer mint less.
pub fn balancer_target(expected: &Nat, s1: u128, s2: u128) -> Nat {
    let bridged = Nat::from(s1.max(s2));
    if *expected > bridged {
        expected.clone() - bridged
    } else {
        Nat::from(0u8)
    }
}

/// What a run mints: the shortfall of `supply` below `target`, at most
/// [MAX_BALANCER_MINT_E8S]; `None` when there is none.
pub fn balancer_mint_amount(target: &Nat, supply: &Nat) -> Option<Nat> {
    if supply >= target {
        return None;
    }
    let shortfall = target.clone() - supply.clone();
    Some(shortfall.min(Nat::from(MAX_BALANCER_MINT_E8S)))
}

/// `bridged_out + out_pending`, the GLDT that is not on the ICP ledger because of the bridge.
fn bridge_counters() -> u128 {
    read_state(|s| {
        s.data
            .bridge
            .bridged_out
            .saturating_add(s.data.bridge.out_pending)
    })
}

/// Whether a swap is active, or one started since `started` was read.
fn swap_overlaps(started: Option<u64>) -> bool {
    read_state(|s| {
        let swaps = &s.data.swap_system;
        !swaps.swaps.is_empty() || started.is_some_and(|started| swaps.swaps_started != started)
    })
}

async fn balance_supply() {
    let _span = tracing::info_span!("BALANCE_SUPPLY").entered();
    let now = read_state(|s| s.env.now_nanos());
    // released on drop: every return below, and a trap after an await
    let Some(_guard) = JobGuard::new(Job::Balancer, now) else {
        info!("Supply balancer already running, exiting");
        return;
    };
    if swap_overlaps(None) {
        info!("A swap is active, skipping this run");
        return;
    }
    let (swap_configs, started) = read_state(|s| {
        (
            s.data.swap_configs.clone(),
            s.data.swap_system.swaps_started,
        )
    });
    info!("Balancing GLDT supply...");

    let owned_nfts_batch = match swap_configs
        .collect_nfts(ic_cdk::api::canister_self())
        .await
    {
        Ok(batch) => batch,
        Err(err) => {
            error!("Failed to fetch NFTs owned by canister: {:?}", err);
            return;
        }
    };
    info!(
        "Collected owned NFTs batch: {} canisters",
        owned_nfts_batch.grouped.len()
    );

    let expected_amounts: HashMap<Principal, Nat> =
        match owned_nfts_batch.calculate_token_equivalent() {
            Ok(amounts) => amounts,
            Err(err) => {
                error!("Failed to calculate expected token amounts: {:?}", err);
                return;
            }
        };

    let s1 = bridge_counters();
    let real_supplies: Vec<(Principal, Nat)> = join_all(expected_amounts.keys().cloned().map(
        |ledger_principal| async move {
            match icrc1_total_supply(ledger_principal).await {
                Ok(supply) => {
                    info!(
                        "Fetched real supply for ledger {}: {}",
                        ledger_principal, supply
                    );
                    Some((ledger_principal, supply))
                }
                Err(err) => {
                    error!(
                        "Failed to fetch total supply for ledger {}: {:?}",
                        ledger_principal, err
                    );
                    None
                }
            }
        },
    ))
    .await
    .into_iter()
    .flatten()
    .collect();
    let s2 = bridge_counters();

    if swap_overlaps(Some(started)) {
        info!("A swap overlapped the reads, skipping this run");
        return;
    }

    // the bridge counters belong to the GLDT ledger only
    let bridge_ledger = gldt_ledger(&swap_configs).ok();
    if bridge_ledger.is_none() && s1.max(s2) > 0 {
        error!("GLDT is bridged out but the swap configs name no single GLDT ledger; skipping this run");
        return;
    }

    let mut mints = Vec::new();
    for (ledger, supply) in real_supplies {
        let Some(expected) = expected_amounts.get(&ledger) else {
            error!(
                "Skipping mint for ledger {}: expected amount not calculated",
                ledger
            );
            continue;
        };
        let target = if Some(ledger) == bridge_ledger {
            balancer_target(expected, s1, s2)
        } else {
            expected.clone()
        };
        let Some(amount) = balancer_mint_amount(&target, &supply) else {
            info!("Ledger {} has sufficient supply, skipping mint", ledger);
            continue;
        };
        let shortfall = target.clone() - supply.clone();
        info!(
            "Ledger {} needs minting: target {}, real {}, minting {}",
            ledger, target, supply, amount
        );
        if shortfall > amount {
            mutate_state(|s| {
                let now = s.env.now_nanos();
                s.data.bridge.push_alert(
                    now,
                    Severity::Warning,
                    format!(
                        "supply balancer: ledger {ledger} is {shortfall} e8s below its target; minted the cap of {amount}"
                    ),
                );
            });
        }
        mints.push(mint_to_fee_account(ledger, amount));
    }
    join_all(mints).await;
    info!("GLDT supply balancer finished");
}

async fn mint_to_fee_account(ledger_canister_id: Principal, amount: Nat) {
    let _span = tracing::info_span!("MINT_TO_FEE_ACCOUNT").entered();

    let this_canister_id = read_state(|s| s.env.canister_id());
    // FIXME: think on the memo, I would rather make random nonce
    let memo_str = format!("AUTO_BALANCE {:?}", ic_cdk::api::time());

    let args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: this_canister_id,
            subaccount: Some(GLDT_LEDGER_FEE_ACCOUNT),
        },
        amount: amount.clone(),
        fee: None,
        created_at_time: Some(timestamp_nanos()),
        memo: Some(Memo::from(memo_str.to_bytes().to_vec())),
    };

    info!(
        "Minting {} tokens to fee account on ledger {}",
        amount, ledger_canister_id
    );

    match icrc1_transfer(ledger_canister_id, &args).await {
        Ok(res) => match res {
            Ok(_) => {
                info!(
                    "Successfully minted {} tokens to fee account on ledger {}",
                    amount, ledger_canister_id
                );
            }
            Err(e) => {
                error!(
                    "Mint failed for ledger {}: {:?}, amount: {}",
                    ledger_canister_id, e, amount
                );
            }
        },
        Err(e) => {
            error!(
                "Mint call failed for ledger {}: {:?}, amount: {}",
                ledger_canister_id, e, amount
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const GLDT: u64 = 100_000_000;

    fn gldt(n: u64) -> Nat {
        Nat::from(n * GLDT)
    }

    #[test]
    fn target_subtracts_larger_counter_read() {
        let expected = gldt(1000);
        let (s1, s2) = (u128::from(100 * GLDT), u128::from(150 * GLDT));
        assert_eq!(balancer_target(&expected, s1, s2), gldt(850));
        assert_eq!(balancer_target(&expected, s2, s1), gldt(850));
        // nothing bridged: the target is the gold
        assert_eq!(balancer_target(&expected, 0, 0), expected);
        // never below zero
        assert_eq!(balancer_target(&gldt(1), u128::MAX, 0), Nat::from(0u8));
        assert_eq!(
            balancer_target(&gldt(1), u128::from(GLDT), 0),
            Nat::from(0u8)
        );
    }

    #[test]
    fn mint_is_capped_at_100_gldt() {
        assert_eq!(MAX_BALANCER_MINT_E8S, 10_000_000_000);
        assert_eq!(
            balancer_mint_amount(&gldt(1000), &Nat::from(0u8)),
            Some(gldt(100))
        );
        assert_eq!(
            balancer_mint_amount(&gldt(1000), &gldt(899)),
            Some(gldt(100))
        );
        assert_eq!(
            balancer_mint_amount(&gldt(1000), &gldt(900)),
            Some(gldt(100))
        );
        // the largest refill so far, 26.2 GLDT, goes out in full
        let refill = Nat::from(2_620_000_000u64);
        assert_eq!(
            balancer_mint_amount(&gldt(1000), &(gldt(1000) - refill.clone())),
            Some(refill)
        );
    }

    #[test]
    fn no_mint_when_supply_at_or_above_target() {
        assert_eq!(balancer_mint_amount(&gldt(1000), &gldt(1000)), None);
        assert_eq!(balancer_mint_amount(&gldt(1000), &gldt(1001)), None);
        assert_eq!(balancer_mint_amount(&Nat::from(0u8), &Nat::from(0u8)), None);
        // bridged GLDT is not minted again: 850 expected on ICP, 850 there
        let target = balancer_target(&gldt(1000), u128::from(150 * GLDT), 0);
        assert_eq!(balancer_mint_amount(&target, &gldt(850)), None);
    }
}
