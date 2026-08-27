use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::run_now_then_interval;
use candid::{Nat, Principal};
use std::time::Duration;
use tracing::{debug, info, warn};
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
        debug!("Sync supplies job already running; skipping execution.");
        return;
    }
    info!("Starting sync supplies job.");
    mutate_state(|state| {
        state.set_is_syncing_supplies(true);
    });

    sync_supplies().await;

    mutate_state(|state| {
        state.set_is_syncing_supplies(false);
    });
    info!("Finished sync supplies job.");
}

/// Iterates over all registered collections, fetches their individual total supplies,
/// and computes/updates their locked value if the supply has changed.
async fn sync_supplies() {
    let simple_collections: Vec<(Principal, u64, Option<String>)> = read_state(|state| {
        state
            .data
            .collections
            .collections
            .iter()
            .filter_map(|entry| {
                let col = entry.value();
                col.item_price_usd.map(|price| (entry.key().clone(), price, col.name.clone()))
            })
            .collect()
    });
    info!("Syncing supplies and computing locked values for {} registered simple collections with configured price", simple_collections.len());

    for (canister_id, price_usd, name) in simple_collections {
        let supply = match crate::services::origyn_nft::get_total_supply(canister_id).await {
            Ok(supply) => supply,
            Err(e) => {
                warn!("Failed to fetch icrc7_total_supply for {canister_id}: {e}");
                continue;
            }
        };

        let current_supply = nat_to_u64_saturating(&supply);
        let locked_value_usd = current_supply.saturating_mul(price_usd);

        // Check if the supply has changed.
        let needs_update = read_state(|state| {
            if let Some(existing) = state.data.collections.collections.get(&canister_id) {
                existing.total_supply != Some(current_supply)
            } else {
                true
            }
        });

        if needs_update {
            info!(
                "Updating value for collection {} ({:?}): supply = {}, locked value = {} USD",
                canister_id,
                name,
                current_supply,
                locked_value_usd
            );
            mutate_state(|state| {
                state.data.collections.upsert_collection_value(
                    canister_id,
                    name.clone(),
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
