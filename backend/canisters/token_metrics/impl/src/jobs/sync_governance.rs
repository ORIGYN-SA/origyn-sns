use canister_time::{now_millis, run_now_then_interval, DAY_IN_MS};
use sns_governance_canister::types::{ListNeuronsResponse, Neuron};
use std::time::Duration;
use tracing::{debug, error, info};
use types::Milliseconds;

use crate::state::{mutate_state, read_state, RuntimeState};

const SYNC_NEURONS_INTERVAL: Milliseconds = DAY_IN_MS;

pub fn start_job() {
    run_now_then_interval(Duration::from_millis(10_000), run)
}

pub fn run() {
    ic_cdk::spawn(sync_neurons_data())
}

pub async fn sync_neurons_data() {
    let canister_id = read_state(|state| state.data.sns_governance_canister);

    mutate_state(|state| {
        state.data.sync_info.last_synced_start = now_millis();
    });

    let mut number_of_scanned_neurons = 0;
    let mut continue_scanning: bool = false;

    let mut args = sns_governance_canister::list_neurons::Args {
        limit: 100,
        start_page_at: None,
        of_principal: None,
    };

    while continue_scanning {
        continue_scanning = false;

        match sns_governance_canister_c2c_client::list_neurons(canister_id, &args).await {
            Ok(response) => {
                // Mutate the state to update the principal with governance data
                mutate_state(|state| {
                    debug!("Updating neurons");
                    response.neurons.iter().for_each(|neuron| {
                        debug!("{:?}", neuron);
                        // update_principal_neuron_mapping(state, neuron);
                        // update_neuron_maturity(state, neuron);
                    });
                });

                // Check if we hit the end of the list
                let number_of_received_neurons = response.neurons.len();
                if ((number_of_received_neurons as u32) == 100) {
                    args.start_page_at = response.neurons.last().map_or_else(
                        || {
                            error!("we should not be here, last neurons from response is missing?");
                            None
                        },
                        |n| {
                            continue_scanning = false;
                            n.id.clone()
                        },
                    );
                }
                number_of_scanned_neurons += number_of_received_neurons;
            }
            Err(err) => {
                let error_message = format!("{err:?}");
                error!(?error_message, "Error fetching neuron data");
            }
        }
    }
    info!("Successfully scanned {number_of_scanned_neurons} neurons.");
    mutate_state(|state| {
        state.data.sync_info.last_synced_end = now_millis();
        state.data.sync_info.last_synced_number_of_neurons = number_of_scanned_neurons;
    });
}

fn update_principal_neuron_mapping(state: &mut RuntimeState, neuron: &Neuron) {}
