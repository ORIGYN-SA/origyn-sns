use crate::state::{mutate_state, read_state};
use crate::types::sns_neuron_manager::NeuronManager;
use crate::types::sns_neuron_manager::NeuronManagerEnum;
use crate::types::sns_neuron_manager::NeuronRewardsManager;
use crate::utils::retry_with_attempts;
use bity_ic_canister_time::{run_now_then_interval, DAY_IN_MS};
use bity_ic_canister_tracing_macros::trace;
use sns_neuron_controller_api_canister::neuron_type::NeuronType;
use std::time::Duration;
use tracing::error;
use tracing::info;
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
    info!("Start processing SNS neurons");

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

    // NOTE: WTN job is commented out. To activate - uncomment
    // // --- WTN NEURONS ---
    // if let Err(err) = retry_with_attempts(MAX_ATTEMPTS, RETRY_DELAY, || async {
    //     let mut wtn_neuron_manager = read_state(|state| {
    //         state
    //             .data
    //             .neuron_managers
    //             .get_neuron_manager(NeuronType::WTN)
    //     });
    //     fetch_and_process_neurons(&mut wtn_neuron_manager).await
    // })
    // .await
    // {
    //     let msg = format!(
    //         "Failed to process WTN neurons after {} attempts: {:?}",
    //         MAX_ATTEMPTS, err
    //     );
    //     error!("{}", msg);
    // } else {
    //     info!("Processing WTN neurons were successful");
    // }

    info!("Finished processing SNS neurons");
}

async fn fetch_and_process_neurons(neuron_manager: &mut NeuronManagerEnum) -> Result<(), String> {
    let manager_type = match neuron_manager {
        NeuronManagerEnum::GoldaoManager(_) => "GOLDAO",
        NeuronManagerEnum::WtnManager(_) => "WTN",
    };

    neuron_manager
        .fetch_and_sync_neurons()
        .await
        .map_err(|err| {
            let msg = format!("[{}] Error fetching and syncing: {:?}", manager_type, err);
            error!("{}", msg);
            err.to_string()
        })?;

    let available_rewards = neuron_manager.get_available_rewards().await;
    let rewards_threshold = neuron_manager.get_rewards_threshold();
    ic_cdk::println!(
        "[{}] available_rewards: {:?}, rewards_threshold: {:?}",
        manager_type,
        available_rewards,
        rewards_threshold
    );

    if available_rewards >= rewards_threshold {
        if neuron_manager.claim_rewards().await.is_not_failed() {
            ic_cdk::println!("[{}] Claim succeeded, distributing rewards.", manager_type);
            let _ = neuron_manager.distribute_rewards().await;
        } else {
            error!("[{}] Reward claim reported failure.", manager_type);
            ic_cdk::println!("[{}] Reward claim reported failure.", manager_type);
        }
    } else {
        info!(
            "[{}] Threshold not reached. Skipping rewards.",
            manager_type
        );
        ic_cdk::println!(
            "[{}] Threshold not reached. Skipping rewards.",
            manager_type
        );
    }

    match neuron_manager {
        NeuronManagerEnum::GoldaoManager(goldao_manager) => {
            mutate_state(|s| {
                s.data.neuron_managers.goldao = goldao_manager.clone();
            });
        }
        NeuronManagerEnum::WtnManager(wtn_manager) => {
            mutate_state(|s| {
                s.data.neuron_managers.wtn = wtn_manager.clone();
            });
        }
    }

    mutate_state(|s| {
        s.data.neuron_managers.now = s.env.now();
    });

    Ok(())
}
