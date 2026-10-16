use crate::state::read_state;
use crate::types::neuron_policy::{
    has_permission, plan_policy_actions, PolicyAction, PolicyEnforcementReport,
};
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
    manage_neuron_response, ManageNeuron, Neuron, NeuronPermissionType,
};
use sns_neuron_controller_api_canister::init::TokenParams;
use sns_neuron_controller_api_canister::neuron_policy::NeuronPolicy;
use std::collections::HashMap;
use tracing::{error, info, trace};
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
    fn get_neuron_policy(&self) -> Option<&NeuronPolicy>;
    fn set_last_policy_enforcement(&mut self, report: PolicyEnforcementReport);
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

    /// Compares the cached neurons with the policy and issues the `manage_neuron` commands
    /// needed to converge. Returns None when no policy is configured. Failures are collected
    /// in the report rather than aborting, so one bad neuron does not block the others.
    async fn enforce_neuron_policy(&self) -> Option<PolicyEnforcementReport> {
        let policy = self.get_neuron_policy()?.clone();
        let (controller, now) = read_state(|s| (s.env.canister_id(), s.env.now()));
        let neurons = &self.get_neurons().all_neurons;
        let plan = plan_policy_actions(neurons, &policy, &controller);

        let mut report = PolicyEnforcementReport {
            timestamp: now,
            neurons_checked: neurons.len() as u32,
            actions_planned: plan.actions.len() as u32,
            actions_succeeded: 0,
            skipped: plan.skipped,
            errors: Vec::new(),
        };
        for skipped in &report.skipped {
            error!("[neuron policy] {skipped}");
        }

        let governance_canister_id = self.get_sns_governance_canister_id();
        for action in plan.actions {
            let neuron_id = hex::encode(&action.neuron_id);
            match apply_policy_action(governance_canister_id, &action).await {
                Ok(()) => {
                    report.actions_succeeded += 1;
                    info!("[neuron policy] neuron {neuron_id}: {}", action.description);
                }
                Err(err) => {
                    let msg = format!("neuron {neuron_id}: {} failed: {err}", action.description);
                    error!("[neuron policy] {msg}");
                    report.errors.push(msg);
                }
            }
        }
        Some(report)
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
        let controller = read_state(|s| s.env.canister_id());
        self.get_neurons()
            .all_neurons
            .iter()
            .filter(|neuron| is_neuron_eligible_for_disburse(neuron, &controller))
            .fold(Nat::from(0_u64), |sum, neuron| {
                sum + neuron.maturity_e8s_equivalent
            })
    }
}

// The SNS rejects disbursing maturity when the maturity, after the worst case maturity modulation of -5%,
// would disburse less than the transaction fee of 10 GOLDAO (1_000_000_000 e8s). 11 GOLDAO (1_100_000_000 e8s) keeps a small margin above that.
pub const MIN_DISBURSABLE_MATURITY_E8S: u64 = 1_100_000_000;

/// A neuron can be disbursed when it holds enough liquid maturity and the controller is
/// allowed to disburse it. Neurons where the controller is only a voting hotkey are skipped
/// instead of producing a daily authorization error.
fn is_neuron_eligible_for_disburse(neuron: &Neuron, controller: &candid::Principal) -> bool {
    neuron.maturity_e8s_equivalent >= MIN_DISBURSABLE_MATURITY_E8S
        && has_permission(neuron, controller, NeuronPermissionType::DisburseMaturity)
}

/// Sends one planned `manage_neuron` command and interprets the governance reply.
async fn apply_policy_action(
    governance_canister_id: CanisterId,
    action: &PolicyAction,
) -> Result<(), String> {
    let args = ManageNeuron {
        subaccount: action.neuron_id.clone(),
        command: Some(action.command.clone()),
    };
    let response = sns_governance_canister_c2c_client::manage_neuron(governance_canister_id, &args)
        .await
        .map_err(|e| format!("call failed: {e:?}"))?;
    match response.command {
        Some(manage_neuron_response::Command::Error(err)) => {
            Err(format!("governance error: {err:?}"))
        }
        Some(_) => Ok(()),
        None => Err("empty response from governance".to_string()),
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
        let controller = read_state(|s| s.env.canister_id());
        let neurons = &self.get_neurons().all_neurons;
        let mut neuron_ids = Vec::new();
        for neuron in neurons {
            if is_neuron_eligible_for_disburse(neuron, &controller) {
                if let Some(id) = &neuron.id {
                    if let Ok(array) = id.clone().id.try_into() {
                        neuron_ids.push(array);
                    }
                }
            }
        }

        if neuron_ids.is_empty() {
            info!(
                "No SNS neurons eligible for maturity disbursement (min threshold: {} e8s)",
                MIN_DISBURSABLE_MATURITY_E8S
            );
            return ClaimRewardResult::Successful;
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
