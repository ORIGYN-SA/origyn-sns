use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::run_now_then_interval;
use candid::Nat;
use std::time::Duration;
use tracing::{debug, warn};
use types::Milliseconds;

const SYNC_SUPPLIES_JOB_INTERVAL: Milliseconds = 30 * 60 * 1000; // 30 minutes

pub fn start_job() {
    debug!("Starting the job to sync collection supplies and compute locked values");
    run_now_then_interval(Duration::from_millis(SYNC_SUPPLIES_JOB_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(run_async());
}

async fn run_async() {
    if read_state(|s| s.get_is_syncing_supplies()) {
        return;
    }
    mutate_state(|state| {
        state.set_is_syncing_supplies(true);
    });

    sync_supplies().await;

    mutate_state(|state| {
        state.set_is_syncing_supplies(false);
    });
}

/// Iterates over all registered collections, fetches their individual total supplies,
/// and computes/updates their locked value if the supply has changed.
async fn sync_supplies() {
    let collections = read_state(|state| state.data.collections.get_all_collections());

    for collection in collections {
        let canister_id = collection.canister_id;

        let price_usd = read_state(|state| state.data.item_prices_usd.get(&canister_id).copied());
        let Some(price_usd) = price_usd else {
            // No admin-configured price yet for this collection; skip valuing it.
            debug!("No price configured for collection {canister_id}; skipping supply sync");
            continue;
        };

        let supply = match crate::services::origyn_nft::get_total_supply(canister_id).await {
            Ok(supply) => supply,
            Err(e) => {
                warn!("Failed to fetch icrc7_total_supply for {canister_id}: {e}");
                continue;
            }
        };

        let current_supply = nat_to_u64_saturating(&supply);
        let locked_value_usd = current_supply.saturating_mul(price_usd);

        // Check if the supply and locked value are already what we have in memory.
        let needs_update = read_state(|state| {
            if let Ok(existing) = state.data.collections.get_collection_by_key(canister_id) {
                existing.total_supply != Some(current_supply)
                    || existing.locked_value_usd != Some(locked_value_usd)
            } else {
                true
            }
        });

        if needs_update {
            mutate_state(|state| {
                state.data.collections.upsert_collection_value(
                    canister_id,
                    collection.name.clone(),
                    locked_value_usd,
                    Some(current_supply),
                );
            });
        }
    }
}

fn nat_to_u64_saturating(nat: &Nat) -> u64 {
    match nat.0.to_u64_digits().as_slice() {
        [] => 0,
        [only] => *only,
        _ => u64::MAX,
    }
}
