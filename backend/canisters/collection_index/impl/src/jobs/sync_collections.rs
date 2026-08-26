use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::run_now_then_interval;
use std::time::Duration;
use tracing::{debug, warn};
use types::Milliseconds;

const SYNC_COLLECTIONS_JOB_INTERVAL: Milliseconds = 60 * 60 * 1000; // 60 minutes

pub fn start_job() {
    debug!("Starting the job to sync collections list from claimlink");
    run_now_then_interval(Duration::from_millis(SYNC_COLLECTIONS_JOB_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(run_async());
}

async fn run_async() {
    if read_state(|s| s.get_is_syncing_collections()) {
        return;
    }
    mutate_state(|state| {
        state.set_is_syncing_collections(true);
    });

    let res = sync_collections().await;

    mutate_state(|state| {
        state.set_is_syncing_collections(false);
    });

    if let Err(e) = res {
        warn!("Failed to sync collections from claimlink: {e}");
    }
}

/// Pulls every collection claimlink knows about and registers their metadata in local state.
/// This avoids fetching supply for all collections in a single job.
async fn sync_collections() -> Result<(), String> {
    let claimlink_canister_id = read_state(|state| state.data.claimlink_canister_id);

    let collections = crate::services::claimlink::fetch_all_collections(claimlink_canister_id)
        .await
        .map_err(|e| format!("claimlink error: {e}"))?;

    for collection in collections {
        let Some(canister_id) = collection.canister_id else {
            continue;
        };

        mutate_state(|state| {
            state
                .data
                .collections
                .upsert_collection_metadata(canister_id, Some(collection.metadata.name.clone()));
        });
    }

    Ok(())
}
