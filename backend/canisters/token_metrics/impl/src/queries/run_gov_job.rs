use crate::jobs::sync_governance;
use ic_cdk::query;

#[query]
async fn run_gov_job() -> String {
    sync_governance::sync_neurons_data().await;
    "done".to_owned()
}
