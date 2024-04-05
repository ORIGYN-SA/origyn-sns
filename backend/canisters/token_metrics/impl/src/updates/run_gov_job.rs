use crate::jobs::sync_governance;
use ic_cdk::update;

#[update]
async fn run_gov_job() -> String {
    ic_cdk::spawn(sync_governance::sync_neurons_data());
    // sync_governance::sync_neurons_data().await;
    "done".to_owned()
}
