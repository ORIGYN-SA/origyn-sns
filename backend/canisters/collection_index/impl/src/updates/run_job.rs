use crate::{
    guards::caller_is_authorised_principal,
    jobs::{compute_stats, sync_collections, sync_supplies},
};
use bity_ic_canister_tracing_macros::trace;
use tracing::info;
pub use collection_index_api::run_job::{
    Args as RunJobArgs, Response as RunJobResponse, Job,
};
use ic_cdk::{query, update};

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub fn run_job(args: RunJobArgs) -> RunJobResponse {
    info!("Manually triggering job: {:?}", args);
    match args {
        Job::ComputeStats => {
            compute_stats::run();
        }
        Job::SyncCollections => {
            sync_collections::run();
        }
        Job::SyncSupplies => {
            sync_supplies::run();
        }
    }
    Ok(())
}

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
async fn run_job_validate(args: RunJobArgs) -> Result<String, String> {
    serde_json::to_string_pretty(&args).map_err(|_| "invalid payload".to_string())
}
