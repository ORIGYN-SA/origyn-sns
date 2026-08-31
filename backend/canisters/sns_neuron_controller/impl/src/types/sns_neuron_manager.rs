use crate::state::read_state;
use crate::types::neurons::sns_neurons::Neurons;
use crate::types::neurons::sns_neurons::SnsNeuronWithMetric;
use crate::types::GoldaoManager;
use crate::utils::{distribute_rewards, fetch_neurons, ClaimRewardResult};
use async_trait::async_trait;
use bity_ic_ledger_utils::compute_neuron_staking_subaccount_bytes;
use bity_ic_utils::rand::generate_rand_nonce;
use candid::{CandidType, Nat};
use enum_dispatch::enum_dispatch;
use icrc_ledger_types::icrc1::{account::Account, transfer::TransferArg};
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::{
    manage_neuron::{
        claim_or_refresh::{By, MemoAndController},
        ClaimOrRefresh, Command,
    },
    manage_neuron_response, ManageNeuron,
};
use sns_neuron_controller_api_canister::init::TokenParams;
use std::collections::HashMap;
use tracing::{error, trace};
use types::{CanisterId, TokenSymbol};
use utils::env::Environment;

#[enum_dispatch]
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum NeuronManagerEnum {
    GoldaoManager(GoldaoManager),
}

#[enum_dispatch(NeuronManagerEnum)]
pub trait NeuronConfig {
    fn get_sns_governance_canister_id(&self) -> CanisterId;
    fn get_sns_ledger_canister_id(&self) -> CanisterId;
    fn get_neurons_mut(&mut self) -> &mut Neurons;
    fn get_neurons(&self) -> &Neurons;
}

#[async_trait]
#[enum_dispatch(NeuronManagerEnum)]
pub trait NeuronManager: NeuronConfig {
    async fn stake_sns_neuron(
        &self,
        amount: u64,
        add_disolve_delay_secs: Option<u32>,
    ) -> Result<Vec<u8>, String> {
        trace!("Starting stake_sns_neuron with amount: {}", amount);
        let nonce = generate_rand_nonce().await?;

        let governance_canister_id = self.get_sns_governance_canister_id();
        let ledger_canister_id = self.get_sns_ledger_canister_id();
        let principal = ic_cdk::api::canister_self();

        let subaccount = compute_neuron_staking_subaccount_bytes(principal, nonce);

        trace!(
            "Initiating transfer to governance canister: {:?}",
            governance_canister_id
        );

        let transfer_result = icrc_ledger_canister_c2c_client::icrc1_transfer(
            ledger_canister_id,
            &(TransferArg {
                from_subaccount: None,
                to: Account {
                    owner: governance_canister_id,
                    subaccount: Some(subaccount),
                },
                fee: None,
                created_at_time: None,
                memo: Some(nonce.into()),
                amount: amount.into(),
            }),
        )
        .await;

        if let Err(e) = transfer_result {
            let err_msg = format!("Transfer error: {:?}", e);
            error!("{err_msg}");
            return Err(err_msg);
        }

        trace!("Calling manage_neuron to claim the neuron");
        let response = sns_governance_canister_c2c_client::manage_neuron(
            governance_canister_id,
            &(ManageNeuron {
                subaccount: vec![],
                command: Some(Command::ClaimOrRefresh(ClaimOrRefresh {
                    by: Some(By::MemoAndController(MemoAndController {
                        controller: Some(principal),
                        memo: nonce,
                    })),
                })),
            }),
        )
        .await
        .map_err(|e| {
            let err_msg = format!("Network error: {e:?}");
            error!("{err_msg}");
            err_msg
        })?;

        let neuron_id = match response.command {
            Some(manage_neuron_response::Command::ClaimOrRefresh(c)) => {
                trace!("Neuron claimed successfully: {:?}", c.refreshed_neuron_id);
                c.refreshed_neuron_id.ok_or_else(|| {
                    let err_msg = "Failed to retrieve neuron ID".to_string();
                    error!("{}", err_msg);
                    err_msg
                })?
            }
            _ => {
                let err_msg = format!("Manage neuron error (while staking) {:?}", response);
                error!("{err_msg}");
                return Err(err_msg);
            }
        };

        if let Some(additional_dissolve_delay_seconds) = add_disolve_delay_secs {
            trace!("Increasing dissolve delay for neuron: {:?}", neuron_id);

            let response = sns_governance_canister_c2c_client::manage_neuron(
                governance_canister_id,
                &(ManageNeuron {
                    subaccount: neuron_id.id.clone(),
                    command: Some(Command::Configure(
                        sns_governance_canister::types::manage_neuron::Configure {
                            operation: Some(
                                sns_governance_canister::types::manage_neuron::configure::Operation::IncreaseDissolveDelay(
                                    sns_governance_canister::types::manage_neuron::IncreaseDissolveDelay {
                                        additional_dissolve_delay_seconds,
                                    },
                                ),
                            ),
                        },
                    )),
                }),
            )
            .await
            .map_err(|e| {
                let err_msg = format!("Failed to increase dissolve delay: {:?}", e);
                error!("{err_msg}");
                err_msg
            })?;

            match response.command {
                Some(manage_neuron_response::Command::Configure(_)) => {
                    trace!("Dissolve delay increased successfully");
                }
                _ => {
                    let err_msg = format!("Failed to increase dissolve delay: {:?}", response);
                    error!("{}", err_msg);
                    return Err(err_msg);
                }
            }
        }

        Ok(neuron_id.id)
    }

    async fn fetch_and_sync_neurons(&mut self) -> Result<(), String> {
        let sns_governance_canister_id = self.get_sns_governance_canister_id();
        let is_test_mode = read_state(|s| s.env.is_test_mode());
        let canister_id = read_state(|s| s.env.canister_id());

        // Error is handled in fetch_neurons
        let neurons = fetch_neurons(sns_governance_canister_id, canister_id, is_test_mode).await?;

        self.get_neurons_mut().all_neurons = neurons.to_vec();
        Ok(())
    }

    fn get_neuron_metrics(&self) -> Vec<SnsNeuronWithMetric> {
        self.get_neurons()
            .all_neurons
            .iter()
            .map(|n| {
                SnsNeuronWithMetric::from_neuron_with_sns_gov_id(
                    n.clone(),
                    self.get_sns_governance_canister_id(),
                )
            })
            .collect()
    }

    async fn get_available_sns_rewards(&self) -> Nat {
        self.get_neurons()
            .all_neurons
            .iter()
            .fold(Nat::from(0_u64), |sum, neuron| {
                sum + neuron.maturity_e8s_equivalent
            })
    }
}

#[async_trait]
#[enum_dispatch(NeuronManagerEnum)]
pub trait NeuronRewardsManager: NeuronManager {
    fn get_reward_tokens(&self) -> HashMap<TokenSymbol, TokenParams>;
    async fn get_available_rewards(&self, token: TokenSymbol) -> Nat;
    async fn claim_rewards(&self, token: TokenSymbol) -> ClaimRewardResult;
    async fn get_available_maturity(&self) -> Nat {
        self.get_available_sns_rewards().await
    }
    async fn claim_sns_rewards(
        &self,
        rewards_destination: sns_governance_canister::types::Account,
    ) -> ClaimRewardResult {
        let neurons = &self.get_neurons().all_neurons;

        let mut neuron_ids = Vec::new();
        for neuron in neurons {
            if let Some(id) = &neuron.id {
                if let Ok(array) = id.clone().id.try_into() {
                    neuron_ids.push(array);
                }
            }
        }

        let disburse_result = disburse_neuron_maturity(
            self.get_sns_governance_canister_id(),
            neuron_ids,
            Some(rewards_destination),
        )
        .await;

        match disburse_result {
            Ok(_) => ClaimRewardResult::Successful,
            Err(error) => ClaimRewardResult::Partial(error.concat()),
        }
    }

    async fn distribute_rewards(
        &self,
        token: TokenSymbol,
        params: TokenParams,
    ) -> Result<(), String> {
        let is_test_mode = read_state(|s| s.env.is_test_mode());
        distribute_rewards(token.ledger_id(is_test_mode), params.destination.into()).await
    }
}

use bity_ic_types::SnsNeuronId;
use candid::Principal;
use sns_governance_canister::types::manage_neuron::DisburseMaturity;
// NOTE: those tokens transaction is a minting transfer, from the governance canister's
// main account (which is also the minting account) to the provided account.
pub async fn disburse_neuron_maturity(
    sns_governance_canister_id: Principal,
    neuron_ids: Vec<SnsNeuronId>,
    to_account: Option<sns_governance_canister::types::Account>,
) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    for neuron_id in neuron_ids {
        match sns_governance_canister_c2c_client::manage_neuron(
            sns_governance_canister_id,
            &ManageNeuron {
                subaccount: neuron_id.into(),
                command: Some(Command::DisburseMaturity(DisburseMaturity {
                    percentage_to_disburse: 100,
                    to_account: to_account.clone(),
                })),
            },
        )
        .await
        {
            Ok(manage_neuron_response) => match manage_neuron_response.command {
                Some(manage_neuron_response::Command::DisburseMaturity(response)) => {
                    trace!("Successfully disbursed maturity for neuron {:?}", response);
                }
                Some(response) => {
                    let error_msg =
                        format!("Unexpected response from manage_neuron: {:?}", response);
                    error!("{}", error_msg);
                    errors.push(error_msg);
                }
                None => {
                    let error_msg = "manage_neuron response contained no command.".to_string();
                    error!("{}", &error_msg);
                    errors.push(error_msg);
                }
            },
            Err(e) => {
                let error_msg = format!(
                    "Failed to disburse maturity for neuron {:?}: {:?}",
                    neuron_id, e
                );
                error!("{}", &error_msg);
                errors.push(error_msg);
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}
