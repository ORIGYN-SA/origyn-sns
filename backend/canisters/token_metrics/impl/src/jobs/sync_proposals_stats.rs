use canister_time::run_now_then_interval;
use sns_governance_canister::types::{ ProposalData, ProposalId };
use std::time::Duration;
use tracing::{ debug, error, info };
use types::Milliseconds;

use crate::state::{ mutate_state, read_state };

// every 5 minutes
const SYNC_PROPOSALS_STATS_INTERVAL: Milliseconds = 5 * 60 * 1_000;

pub fn start_job() {
    debug!("Starting the proposals metrics sync job..");
    run_now_then_interval(Duration::from_millis(SYNC_PROPOSALS_STATS_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(sync_proposals_metrics_data())
}

pub async fn sync_proposals_metrics_data() {
    let canister_id = read_state(|state| state.data.sns_governance_canister);
    let last_synced_proposal_id = read_state(|state| state.data.sync_info.last_synced_proposal_id);
    let mut number_of_scanned_proposals = 0;
    let mut continue_scanning = true;

    let mut args = sns_governance_canister::list_proposals::Args {
        limit: 50,
        before_proposal: None,
        exclude_type: Vec::new(),
        include_status: Vec::new(),
        include_reward_status: Vec::new(),
    };

    while continue_scanning {
        continue_scanning = false;

        match sns_governance_canister_c2c_client::list_proposals(canister_id, &args).await {
            Ok(response) => {
                let number_of_received_proposals = response.proposals.len();
                if number_of_received_proposals == 0 {
                    break;
                }

                match response.proposals.first() {
                    Some(first_proposal_in_batch) => {
                        let first_id = first_proposal_in_batch.id.unwrap_or(ProposalId { id: 0 });
                        let last_synced_id = last_synced_proposal_id.unwrap_or(ProposalId {
                            id: 0,
                        });
                        if first_id.id > last_synced_id.id {
                            mutate_state(|state| {
                                state.data.sync_info.last_synced_proposal_id = Some(first_id);
                            });
                        }
                    }
                    None => {}
                }

                for proposal in &response.proposals {
                    if let Some(last_from_state) = &last_synced_proposal_id {
                        match proposal.id {
                            Some(proposal_id) => {
                                if proposal_id.id <= last_from_state.id {
                                    continue_scanning = false;
                                    break;
                                } else {
                                    args.before_proposal = Some(proposal_id);
                                }
                            }
                            None => {
                                // Get out of the loop if we don't have an id
                                continue_scanning = false;
                                break;
                            }
                        }
                    }
                    update_proposals_metrics(proposal);
                    number_of_scanned_proposals += 1;
                }

                if number_of_received_proposals == (args.limit as usize) {
                    continue_scanning = true;
                }
            }
            Err(err) => {
                let error_message = format!("{err:?}");
                error!(?error_message, "Error fetching proposal data");
            }
        }
    }

    info!("Successfully scanned {number_of_scanned_proposals} proposals.");

    mutate_state(|state| {
        state.data.sync_info.last_synced_number_of_proposals = number_of_scanned_proposals;
    });

    info!("Voting metrics updated successfully.");
}

pub fn update_proposals_metrics(proposal: &ProposalData) {
    mutate_state(|state| {
        let metrics = &mut state.data.porposals_metrics;
        let metrics_calculations = &mut state.data.proposals_metrics_calculations;
        metrics.total_proposals += 1;
        match proposal.latest_tally.clone() {
            Some(tally) => {
                let this_proposal_participation =
                    (((tally.yes as f64) + (tally.no as f64)) / (tally.total as f64)) * 100.0;
                println!("{this_proposal_participation:?}");
                if tally.total > metrics.total_voting_power {
                    metrics.total_voting_power = tally.total;
                }
                metrics_calculations.cumulative_voting_power += tally.total;

                // Update cumulative voting participation and count of valid tallies
                metrics_calculations.cumulative_voting_participation += this_proposal_participation;
                metrics_calculations.valid_tally_count += 1;

                // Update the average voting participation
                metrics.average_voting_participation = (((
                    metrics_calculations.cumulative_voting_participation as f64
                ) /
                    (metrics_calculations.valid_tally_count as f64)) *
                    100.0) as u64;

                // Update the average voting power
                metrics.average_voting_power =
                    metrics_calculations.cumulative_voting_power / metrics.total_proposals;
            }
            None => {}
        }
    });
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use canister_time::timestamp_seconds;
    use sns_governance_canister::types::{
        neuron::DissolveState,
        Neuron,
        NeuronId,
        ProposalData,
        Tally,
    };
    use types::{ CanisterId, NeuronInfo };
    use utils::env::CanisterEnv;

    use crate::state::{ init_state, mutate_state, read_state, Data, RuntimeState };

    fn init_runtime_state() {
        let env = CanisterEnv::new(true);
        let data = Data::new(
            CanisterId::anonymous(),
            CanisterId::anonymous(),
            CanisterId::anonymous(),
            "aaaa-aa.00..1".to_string(),
            Vec::new()
        );
        init_state(RuntimeState::new(env.clone(), data));
    }

    use super::update_proposals_metrics;

    #[test]
    fn test_update_proposals_metrics() {
        init_runtime_state();

        // Proposal 1
        let mut proposal_1 = ProposalData::default();
        proposal_1.proposal_creation_timestamp_seconds = 86_400;
        proposal_1.latest_tally = Some(Tally {
            timestamp_seconds: 86_400,
            yes: 10,
            no: 3,
            total: 50,
        });
        update_proposals_metrics(&proposal_1);
        let proposals_metrics = read_state(|state| state.data.porposals_metrics.clone());

        assert_eq!(proposals_metrics.total_proposals, 1);
        assert_eq!(proposals_metrics.total_voting_power, 50);
        assert_eq!(proposals_metrics.average_voting_power, 50);
        // avg = (10 + 3) / 50) = 0.26
        assert_eq!(proposals_metrics.average_voting_participation, 2600u64);

        // Proposal 2
        let mut proposal_2 = ProposalData::default();
        proposal_2.proposal_creation_timestamp_seconds = 2 * 86_400;
        proposal_2.latest_tally = Some(Tally {
            timestamp_seconds: 2 * 86_400,
            yes: 20,
            no: 4,
            total: 60,
        });
        update_proposals_metrics(&proposal_2);
        let proposals_metrics = read_state(|state| state.data.porposals_metrics.clone());

        assert_eq!(proposals_metrics.total_proposals, 2);
        assert_eq!(proposals_metrics.total_voting_power, 60);
        // avg = 50 + 60 / 2 = 55
        assert_eq!(proposals_metrics.average_voting_power, 55);
        // avg = ((10 + 3) / 50 + (20 + 4) / 60) / 2 = 0.33
        assert_eq!(proposals_metrics.average_voting_participation, 3300u64);

        // Proposal 3
        let mut proposal_3 = ProposalData::default();
        proposal_3.proposal_creation_timestamp_seconds = 3 * 86_400;
        proposal_3.latest_tally = Some(Tally {
            timestamp_seconds: 3 * 86_400,
            yes: 45,
            no: 10,
            total: 100,
        });
        update_proposals_metrics(&proposal_3);
        let proposals_metrics = read_state(|state| state.data.porposals_metrics.clone());

        assert_eq!(proposals_metrics.total_proposals, 3);
        assert_eq!(proposals_metrics.total_voting_power, 100);
        // avg = 50 + 60 + 100 / 3 = 70
        assert_eq!(proposals_metrics.average_voting_power, 70);
        // avg = ((10 + 3) / 50 + (20 + 4) / 60 + (45 + 10) / 100) / 3 = 0.4033333333333333
        assert_eq!(proposals_metrics.average_voting_participation, 4033u64);
    }
}
