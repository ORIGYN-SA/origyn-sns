use crate::state::{mutate_state, read_state};
use crate::types::sns_neuron_manager::NeuronManager;
use crate::types::sns_neuron_manager::NeuronManagerEnum;
use crate::types::sns_neuron_manager::NeuronRewardsManager;
use crate::utils::{retry_with_attempts, ClaimRewardResult};
use bity_ic_canister_time::{run_now_then_interval, DAY_IN_MS};
use bity_ic_canister_tracing_macros::trace;
use sns_neuron_controller_api_canister::neuron_type::NeuronType;
use std::time::Duration;
use tracing::error;
use tracing::info;
use types::{Milliseconds, TokenSymbol};
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
    info!("Start processing SNS neurons job");

    // --- GOLDAO NEURONS ---
    if let Err(err) = retry_with_attempts(MAX_ATTEMPTS, RETRY_DELAY, || async {
        let mut goldao_neuron_manager = read_state(|state| {
            state
                .data
                .neuron_managers
                .get_neuron_manager(NeuronType::GOLDAO)
        });
        fetch_and_process_neurons(&mut goldao_neuron_manager).await
    })
    .await
    {
        let msg = format!(
            "Failed to process GOLDAO neurons after {} attempts: {:?}",
            MAX_ATTEMPTS, err
        );
        error!("{}", msg);
    } else {
        info!("Processing GOLDAO neurons were successful");
    }

    info!("Finished processing SNS neurons");
}

pub(crate) async fn fetch_and_process_neurons(neuron_manager: &mut NeuronManagerEnum) -> Result<(), String> {
    let manager_type = match neuron_manager {
        NeuronManagerEnum::GoldaoManager(_) => "GOLDAO",
    };

    info!("fetch_and_process_neurons started for {}", manager_type);

    neuron_manager
        .fetch_and_sync_neurons()
        .await
        .map_err(|err| {
            let msg = format!("[{}] Error fetching and syncing: {:?}", manager_type, err);
            info!("{}", msg);
            error!("{}", msg);
            err.to_string()
        })?;

    for (token, params) in neuron_manager.get_reward_tokens() {
        let available_rewards = neuron_manager.get_available_rewards(token).await;

        info!(
            "[{}][{:?}] available_rewards: {:?}, rewards_threshold: {:?}",
            manager_type, token, available_rewards, params.threshold
        );

        if available_rewards >= params.threshold {
            let claim_result = neuron_manager.claim_rewards(token).await;
            info!(
                "[{}][{:?}] Claim finished with result: {:?}",
                manager_type,
                token,
                claim_result
            );
            match &claim_result {
                ClaimRewardResult::Successful => {
                    let _ = neuron_manager.distribute_rewards(token, params).await;
                }
                ClaimRewardResult::Partial(error) => {
                    let msg = format!("[{}][{:?}] Claim rewards partially failed: {}", manager_type, token, error);
                    error!("{}", msg);
                    let _ = neuron_manager.distribute_rewards(token, params).await;
                }
                ClaimRewardResult::Failed(error) => {
                    let msg = format!("[{}][{:?}] Claim rewards failed: {}", manager_type, token, error);
                    error!("{}", msg);
                }
            }
        } else {
            info!(
                "[{}][{:?}] Threshold not reached. Skipping rewards.",
                manager_type, token
            );
        }
    }

    // --- GOLDAO SNS GOVERNANCE REWARDS (Neuron Maturity) ---
    #[allow(irrefutable_let_patterns)]
    if let NeuronManagerEnum::GoldaoManager(_) = neuron_manager {
        if let Some(params) = neuron_manager.get_reward_tokens().get(&TokenSymbol::GOLDAO) {
            let available_sns_rewards = neuron_manager.get_available_maturity().await;
            let threshold_sns_rewards = candid::Nat::from(1000_0000_0000_u64); // 1000 GOLDAO in e8s

            info!(
                "[GOLDAO] available_sns_rewards (maturity): {:?}, threshold: {:?}",
                available_sns_rewards, threshold_sns_rewards
            );

            if available_sns_rewards >= threshold_sns_rewards {
                let rewards_destination = sns_governance_canister::types::Account {
                    owner: Some(params.destination.owner),
                    subaccount: params.destination.subaccount.map(|s| {
                        sns_governance_canister::types::Subaccount {
                            subaccount: s.to_vec(),
                        }
                    }),
                };

                let claim_result = neuron_manager.claim_sns_rewards(rewards_destination).await;
                info!(
                    "[GOLDAO] Claim sns_governance rewards finished with result: {:?}",
                    claim_result
                );
                match &claim_result {
                    ClaimRewardResult::Successful => {}
                    ClaimRewardResult::Partial(error) | ClaimRewardResult::Failed(error) => {
                        let msg = format!("[GOLDAO] Claim sns_governance rewards failed: {}", error);
                        info!("{}", msg);
                        error!("{}", msg);
                    }
                }
            } else {
                info!("[GOLDAO] sns_governance rewards threshold not reached. Skipping.");
            }
        } else {
            info!("[GOLDAO] GOLDAO token config not found in reward tokens. Cannot claim sns_governance rewards.");
        }
    }

    match neuron_manager {
        NeuronManagerEnum::GoldaoManager(goldao_manager) => {
            mutate_state(|s| {
                s.data.neuron_managers.goldao = goldao_manager.clone();
            });
        }
    }

    mutate_state(|s| {
        s.data.neuron_managers.now = s.env.now();
    });

    Ok(())
}
