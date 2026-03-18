use crate::state::{mutate_state, read_state};
use crate::types::icp_neuron_manager::IcpManager;
use crate::utils::retry_with_attempts;

use bity_ic_canister_time::{run_now_then_interval, DAY_IN_MS};
use bity_ic_canister_tracing_macros::trace;
use std::time::Duration;
use tracing::{error, info};
use types::Milliseconds;
use utils::env::Environment;

const PROCESS_NEURONS_INTERVAL: Milliseconds = DAY_IN_MS; // 1 day
const MAX_ATTEMPTS: u32 = 3;
const RETRY_DELAY: Duration = Duration::from_secs(5 * 60); // each 5 minutes

pub fn start_job() {
    run_now_then_interval(Duration::from_millis(PROCESS_NEURONS_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(run_async());
}

#[trace]
async fn run_async() {
    if let Err(err) = retry_with_attempts(MAX_ATTEMPTS, RETRY_DELAY, || async {
        let mut icp_neuron_manager = read_state(|state| state.data.neuron_managers.icp.clone());
        fetch_and_process_neurons(&mut icp_neuron_manager).await
    })
    .await
    {
        error!(
            "Failed to process ICP neurons after {} attempts: {:?}",
            MAX_ATTEMPTS, err
        );
    }
}

async fn fetch_and_process_neurons(neuron_manager: &mut IcpManager) -> Result<(), String> {
    neuron_manager
        .fetch_and_sync_neurons()
        .await
        .map_err(|err| {
            error!("Error fetching and syncing neurons: {:?}", err);
            err.to_string()
        })?;

    mutate_state(|s| {
        s.data.neuron_managers.icp = neuron_manager.clone();
        s.data.neuron_managers.now = s.env.now();
    });

    // Check each neuron individually against the threshold
    let rewards_threshold = neuron_manager.icp_rewards_threshold.clone();

    neuron_manager.neurons.all_neurons.retain(|neuron| {
        neuron.id.is_some()
            && neuron.maturity_e8s_equivalent > 10_000 // Cover transfer fee
            && neuron.maturity_e8s_equivalent >= rewards_threshold
    });

    // Log total vs eligible rewards for better visibility
    let total_rewards = neuron_manager.get_available_nns_rewards(None).await;

    let eligible_rewards = total_rewards; // Same as total since we filtered

    info!(
        "NNS rewards summary: {} e8s eligible after filtering (threshold: {} e8s)",
        eligible_rewards, rewards_threshold
    );

    if neuron_manager.neurons.all_neurons.is_empty() {
        info!(
            "No neurons meet the maturity threshold of {} e8s, skipping distribution",
            rewards_threshold
        );
    } else {
        info!(
            "Found {} neurons eligible for maturity distribution (threshold: {} e8s)",
            neuron_manager.neurons.all_neurons.len(),
            rewards_threshold
        );

        // Get the rewards destination from state
        let rewards_destination = read_state(|state| state.data.rewards_destination);

        match rewards_destination {
            Some(destination) => {
                info!("Starting NNS maturity distribution to {}", destination);

                match neuron_manager
                    .disburse_maturity_from_eligible_neurons(destination, &rewards_threshold)
                    .await
                {
                    Ok(()) => {
                        info!("Successfully completed NNS maturity distribution");
                    }
                    Err(e) => {
                        error!("Failed to disburse NNS maturity: {}", e);
                        return Err(format!("Maturity disbursement failed: {}", e));
                    }
                }
            }
            None => {
                let error_msg = "No rewards destination configured for NNS maturity distribution";
                error!("{}", error_msg);
                return Err(error_msg.to_string());
            }
        }
    }

    Ok(())
}
