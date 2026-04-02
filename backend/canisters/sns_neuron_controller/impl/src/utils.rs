use crate::state::read_state;
use candid::{Nat, Principal};
use futures::future::join_all;
use icrc_ledger_types::icrc1::{
    account::{Account, Subaccount},
    transfer::TransferArg,
};
use sns_governance_canister::types::ListNeurons;
use sns_governance_canister::types::Neuron;
use sns_governance_canister::types::NeuronId;
use std::time::Duration;
use tracing::debug;
use tracing::{error, info};

pub async fn transfer_token(
    from_sub_account: Subaccount,
    to_account: Account,
    ledger_id: Principal,
    amount: Nat,
) -> Result<(), String> {
    match icrc_ledger_canister_c2c_client::icrc1_transfer(
        ledger_id,
        &(TransferArg {
            from_subaccount: Some(from_sub_account),
            to: to_account,
            fee: None,
            created_at_time: None,
            amount,
            memo: None,
        }),
    )
    .await
    {
        Ok(Ok(_)) => Ok(()),
        Ok(Err(error)) => Err(format!("Transfer error: {error:?}")),
        Err(error) => Err(format!("Network error: {error:?}")),
    }
}

// Fetch all neurons from SNS governance canister
pub async fn fetch_neurons(
    sns_governance_canister_id: Principal,
    canister_id: Principal,
    is_test_mode: bool,
) -> Result<Vec<Neuron>, String> {
    let limit = 100;

    let mut args = ListNeurons {
        limit,
        start_page_at: None,
        of_principal: Some(canister_id),
    };

    let mut number_of_scanned_neurons = 0;
    let mut continue_scanning = true;

    let mut neurons = Vec::new();
    while continue_scanning {
        continue_scanning = false;
        debug!("Fetching neuron data");

        // NOTE: the reason why we need a loop here is that list_neurons can only return 100 neurons
        // at a time. In fact, I'm not sure that we would exceed the limit in any case, but it's
        // better to future proof it in case if it works that way.
        match sns_governance_canister_c2c_client::list_neurons(sns_governance_canister_id, &args)
            .await
        {
            Ok(response) => {
                let number_of_received_neurons = response.neurons.len();
                if (number_of_received_neurons as u32) == limit {
                    args.start_page_at = response.neurons.last().map_or_else(
                        || {
                            error!(
                                "Missing last neuron to continue iterating.
                                This should not be possible as the limits are checked. Stopping loop here."
                            );
                            None
                        },
                        |n| {
                            continue_scanning = true;
                            if is_test_mode && number_of_scanned_neurons == 400 {
                                continue_scanning = false;
                            }
                            n.id.clone()
                        }
                    );
                }
                neurons.extend(response.neurons);
                number_of_scanned_neurons += number_of_received_neurons;
            }
            Err(e) => {
                error!("Failed to obtain all neurons data {:?}", e);
                return Err(format!("Failed to obtain all neurons data {:?}", e));
            }
        }
    }
    Ok(neurons)
}

pub enum RewardSumResult {
    Full(Nat),
    Partial(Nat, String),
    Empty,
}

impl RewardSumResult {
    pub fn get_internal(self) -> Nat {
        match self {
            RewardSumResult::Full(nat) => nat,
            RewardSumResult::Partial(nat, _) => nat,
            RewardSumResult::Empty => Nat::from(0u8),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ClaimRewardResult {
    Succesfull,
    Failed(String),
}

impl ClaimRewardResult {
    pub fn is_not_failed(&self) -> bool {
        !matches!(self, ClaimRewardResult::Failed(_))
    }
}

// TODO: think of outstanding payments struct in this context
pub async fn distribute_rewards(sns_ledger_canister_id: Principal) -> Result<(), String> {
    let rewards_destination = read_state(|state| state.data.rewards_destination);
    match rewards_destination {
        None => {
            info!("No rewards destination found");
            return Ok(());
        }
        Some(rewards_destination) => {
            info!("Distributing rewards to {}", rewards_destination);

            let fee = icrc_ledger_canister_c2c_client::icrc1_fee(sns_ledger_canister_id)
                .await
                .unwrap();
            // Transfer all the tokens to sns_rewards to be distributed
            match icrc_ledger_canister_c2c_client::icrc1_balance_of(
                sns_ledger_canister_id,
                &(Account {
                    owner: ic_cdk::api::canister_self(),
                    subaccount: None,
                }),
            )
            .await
            {
                Ok(balance) => {
                    match transfer_token(
                        [0; 32],
                        rewards_destination.into(),
                        sns_ledger_canister_id,
                        balance - fee,
                    )
                    .await
                    {
                        Ok(_) => {
                            info!("Successfully transferred rewards");

                            Ok(())
                        }
                        Err(error_message) => {
                            let error_message =
                                format!("Error during transfer rewards: {}", error_message);
                            error!(error_message);
                            Err(error_message)
                        }
                    }
                }
                Err(e) => {
                    let error_message = format!(
                "Failed to fetch token balance of sns_neuron_controller from ledger canister id {} with ERROR : {:?}",
                sns_ledger_canister_id, e
            );
                    error!("{}", error_message);
                    Err(error_message)
                }
            }
        }
    }
}

pub async fn sns_rewards_fetch_neuron_reward_balance(
    ledger_canister_id: Principal,
    sns_rewards_canister_id: Principal,
    neuron_id: &NeuronId,
) -> Result<Nat, String> {
    match icrc_ledger_canister_c2c_client::icrc1_balance_of(
        ledger_canister_id,
        &(Account {
            owner: sns_rewards_canister_id,
            subaccount: Some(neuron_id.into()),
        }),
    )
    .await
    {
        Ok(t) => Ok(t),
        Err(e) => {
            let error_message = format!(
                "Failed to fetch token balance of ledger canister id {} with ERROR : {:?}",
                ledger_canister_id, e
            );
            error!("{}", error_message);
            Err(error_message)
        }
    }
}
// NOTE: the following function calculates the general rewards as sum of all neuron rewards (bigger than the fee).
// If one of the rewards cannot be fetched, the general reward is calculated anyway, but it's
// defined as RewardSumResult::Partial
pub async fn sns_rewards_calculate_available_rewards(
    neurons: &[Neuron],
    sns_rewards_canister_id: Principal,
    sns_ledger_canister_id: Principal,
) -> RewardSumResult {
    let fee = icrc_ledger_canister_c2c_client::icrc1_fee(sns_ledger_canister_id)
        .await
        .unwrap_or_default();

    let futures: Vec<_> = neurons
        .iter()
        .filter_map(|neuron| {
            neuron.id.as_ref().map(|id| {
                sns_rewards_fetch_neuron_reward_balance(
                    sns_ledger_canister_id,
                    sns_rewards_canister_id,
                    id,
                )
            })
        })
        .collect();

    let total_futures = futures.len();

    let results = join_all(futures).await;

    let mut available_rewards_amount: Nat = Nat::from(0u64);
    let mut error_messages = Vec::new();
    let mut success_count = 0;
    let mut ignored_count = 0;

    for result in results {
        match result {
            Ok(reward) => {
                success_count += 1;
                if reward > fee {
                    available_rewards_amount += reward.clone();
                } else {
                    ignored_count += 1;
                    // Log small balances if they are above 0 but below the fee
                    if reward > 0_u64 {}
                }
            }
            Err(error) => {
                let msg = format!("Failed to fetch neuron reward balance: {error}");
                error!("{}", msg);
                error_messages.push(error);
            }
        }
    }

    info!(
        "[REWARD-CALC] Summary: Success: {}, Ignored (below fee): {}, Errors: {}, Total Accrued: {}", 
        success_count, ignored_count, error_messages.len(), available_rewards_amount
    );

    if error_messages.is_empty() {
        info!("Successfully got available rewards amount");
        RewardSumResult::Full(available_rewards_amount)
    } else {
        let error_message = error_messages.join("\n");
        if error_messages.len() >= neurons.len() {
            RewardSumResult::Empty
        } else {
            RewardSumResult::Partial(available_rewards_amount, error_message)
        }
    }
}

pub async fn sns_rewards_claim_rewards(
    neurons: &[Neuron],
    sns_rewards_canister_id: Principal,
    token: &str,
) -> ClaimRewardResult {
    let futures: Vec<_> = neurons
        .iter()
        .filter_map(|neuron| {
            neuron.id.as_ref().map(|neuron_id| {
                let args = sns_rewards_api_canister::claim_reward::Args {
                    neuron_id: neuron_id.clone(),
                    token: String::from(token),
                };

                async move {
                    match sns_rewards_c2c_client::claim_reward(sns_rewards_canister_id, &args).await
                    {
                        Ok(response) => match response {
                            sns_rewards_api_canister::claim_reward::Response::Ok(_) => Ok(()),
                            error => {
                                let msg = format!(
                                    "[sns_rewards_claim_rewards] Error response for neuron ID {}: {:?}",
                                    neuron_id, error
                                );
                                error!("{}", msg);
                                Err(msg)
                            }
                        },
                        Err(e) => {
                            let msg = format!(
                                "[sns_rewards_claim_rewards] Failed to call claim_reward for neuron ID {}: {:?}",
                                neuron_id, e
                            );
                            error!("{}", msg);
                            Err(msg)
                        }
                    }
                }
            })
        })
        .collect();

    let results = join_all(futures).await;

    let mut error_messages = Vec::new();
    for result in results {
        if let Err(e) = result {
            error!("[sns_rewards_claim_rewards] Error captured: {}", e);
            error_messages.push(e);
        }
    }

    if error_messages.is_empty() {
        info!("[sns_rewards_claim_rewards] Successfully claimed rewards for all neurons");
        ClaimRewardResult::Succesfull
    } else {
        let error_message = error_messages.join("\n");
        error!("[sns_rewards_claim_rewards] Failed to claim rewards for neurons");
        ClaimRewardResult::Failed(error_message)
    }
}

pub async fn retry_with_attempts<F, Fut>(
    max_attempts: u32,
    _delay_duration: Duration,
    mut f: F,
) -> Result<(), String>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<(), String>>,
{
    for attempt in 1..=max_attempts {
        match f().await {
            Ok(_) => {
                return Ok(());
            }
            Err(err) => {
                error!("Attempt {}: Error - {:?}", attempt, err);
                if attempt == max_attempts {
                    return Err(err);
                }
            }
        }
    }
    Ok(())
}
