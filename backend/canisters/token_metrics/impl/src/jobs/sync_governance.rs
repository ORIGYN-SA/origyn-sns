use candid::Principal;
use canister_time::{now_millis, run_now_then_interval, DAY_IN_MS};
use sns_governance_canister::types::{Governance, ListNeuronsResponse, Neuron};
use std::time::Duration;
use tracing::{debug, error, field::debug, info};
use types::Milliseconds;

use crate::state::{mutate_state, read_state, GovernanceStats, RuntimeState};

const SYNC_NEURONS_INTERVAL: Milliseconds = DAY_IN_MS;

pub fn start_job() {
    debug!("Starting the governance sync job..");
    run_now_then_interval(Duration::from_millis(SYNC_NEURONS_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(sync_neurons_data())
}

pub async fn sync_neurons_data() {
    info!("sync_neurons_data..");
    let canister_id = read_state(|state| state.data.sns_governance_canister);

    mutate_state(|state| {
        state.data.sync_info.last_synced_start = now_millis();
    });

    let mut number_of_scanned_neurons = 0;
    let mut continue_scanning: bool = true;

    let mut args = sns_governance_canister::list_neurons::Args {
        limit: 100,
        start_page_at: None,
        of_principal: None,
    };

    while continue_scanning {
        continue_scanning = false;

        match sns_governance_canister_c2c_client::list_neurons(canister_id, &args).await {
            Ok(response) => {
                info!("{:?}", response);
                // Mutate the state to update the principal with governance data
                mutate_state(|state| {
                    info!("Updating neurons");
                    response.neurons.iter().for_each(|neuron| {
                        info!("{:?}", neuron);
                        update_principal_neuron_mapping(state, neuron);
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
                            continue_scanning = true;
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

fn update_principal_neuron_mapping(state: &mut RuntimeState, neuron: &Neuron) {
    let principal_with_neurons = &mut state.data.principal_neurons;
    let principal_with_stats = &mut state.data.principal_gov_stats;
    // only look at the first permissioned principal, as this is in 99% cases the owner of the neuron
    if let Some(permissioned_principal) = neuron.permissions.first() {
        if let Some(pid) = permissioned_principal.principal {
            // Update the array of neurons in the principal_neurons map
            principal_with_neurons
                .entry(pid)
                .and_modify(|neurons| {
                    if let Some(id) = &neuron.id {
                        if !neurons.contains(id) {
                            neurons.push(id.clone());
                        }
                    }
                })
                .or_insert_with(|| {
                    if let Some(id) = &neuron.id {
                        vec![id.clone()]
                    } else {
                        vec![]
                    }
                });

            let mut total_staked = 0u64;

            let neuron_staked_maturity = neuron.staked_maturity_e8s_equivalent.unwrap_or(0);
            // Update the governance stats of the Principal
            principal_with_stats
                .entry(pid)
                .and_modify(|stats| {
                    // Total staked is how much the principal staked at the begginging + how much of maturity they restaked
                    stats.total_staked += neuron.cached_neuron_stake_e8s + neuron_staked_maturity;
                    // Total locked is the amount of tokens they have staked
                    stats.total_locked += neuron.cached_neuron_stake_e8s;
                    // Total unlocked is `maturity_e8s_equivalent` which can be claimed
                    stats.total_unlocked += neuron.maturity_e8s_equivalent;
                    // Total rewards is what they have as maturity and what they have as staked_maturity
                    stats.total_rewards += neuron.staked_maturity_e8s_equivalent.unwrap_or(0)
                        + neuron.maturity_e8s_equivalent
                })
                .or_insert_with(|| GovernanceStats {
                    total_locked: neuron.cached_neuron_stake_e8s,
                    total_staked: neuron.cached_neuron_stake_e8s + neuron_staked_maturity,
                    total_unlocked: neuron.maturity_e8s_equivalent,
                    total_rewards: neuron.staked_maturity_e8s_equivalent.unwrap_or(0)
                        + neuron.maturity_e8s_equivalent,
                });
            mutate_state(|state| {
                state.data.all_gov_stats.total_locked += neuron.cached_neuron_stake_e8s;
                state.data.all_gov_stats.total_staked +=
                    neuron.cached_neuron_stake_e8s + neuron_staked_maturity;
                state.data.all_gov_stats.total_unlocked += neuron.maturity_e8s_equivalent;
                state.data.all_gov_stats.total_rewards +=
                    neuron.staked_maturity_e8s_equivalent.unwrap_or(0)
                        + neuron.maturity_e8s_equivalent;
            })
        }
    }
}
