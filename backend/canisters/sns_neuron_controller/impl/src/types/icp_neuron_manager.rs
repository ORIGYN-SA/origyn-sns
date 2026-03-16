use crate::types::neurons::nns_neurons::disburse_neuron_maturity;
use crate::types::neurons::nns_neurons::Neurons;
use crate::types::neurons::nns_neurons::NnsNeuronWithMetric;
use bity_ic_ledger_utils::compute_neuron_staking_subaccount_bytes;
use candid::Principal;
use candid::{CandidType, Nat};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::TransferArg;
use nns_governance_canister::types::manage_neuron::claim_or_refresh::{By, MemoAndController};
use nns_governance_canister::types::manage_neuron::{ClaimOrRefresh, Command};
use nns_governance_canister::types::Neuron;
use nns_governance_canister::types::{manage_neuron_response, ManageNeuron};
use serde::{Deserialize, Serialize};
// use tracing::trace;
use tracing::{error, info};
use types::CanisterId;
use utils::rand::generate_rand_nonce;

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct IcpManager {
    pub nns_governance_canister_id: CanisterId,
    pub nns_ledger_canister_id: CanisterId,
    pub neurons: Neurons,
    pub icp_rewards_threshold: Nat,
}

// NOTE: ic network parameters
impl Default for IcpManager {
    fn default() -> Self {
        Self {
            nns_governance_canister_id: Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai")
                .unwrap(),
            nns_ledger_canister_id: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
            neurons: Neurons::default(),
            icp_rewards_threshold: Nat::from(100_000_000_000_u64),
        }
    }
}

impl IcpManager {
    pub fn new(
        nns_governance_canister_id: CanisterId,
        nns_ledger_canister_id: CanisterId,
        icp_rewards_threshold: Nat,
    ) -> Self {
        Self {
            nns_governance_canister_id,
            nns_ledger_canister_id,
            neurons: Neurons::default(),
            icp_rewards_threshold,
        }
    }

    fn get_nns_governance_canister_id(&self) -> CanisterId {
        self.nns_governance_canister_id
    }
    fn get_nns_ledger_canister_id(&self) -> CanisterId {
        self.nns_ledger_canister_id
    }
    fn get_neurons(&self) -> &Neurons {
        &self.neurons
    }
    fn get_neurons_mut(&mut self) -> &mut Neurons {
        &mut self.neurons
    }

    pub async fn fetch_and_sync_neurons(&mut self) -> Result<(), String> {
        let nns_governance_canister_id = self.get_nns_governance_canister_id();

        // Error is handled in fetch_neurons
        let args = nns_governance_canister::types::ListNeurons {
            neuron_ids: Vec::new(),
            include_neurons_readable_by_caller: true,
        };

        let mut neurons = Vec::new();

        match nns_governance_canister_c2c_client::list_neurons(nns_governance_canister_id, &args)
            .await
        {
            Ok(response) => {
                neurons.extend(response.full_neurons);
            }
            Err(e) => {
                error!("SYNC NEURONS :: Failed to obtain all neurons data {:?}", e);
                return Err(format!("Failed to obtain all neurons data {:?}", e));
            }
        }

        self.get_neurons_mut().all_neurons = neurons.to_vec();
        Ok(())
    }

    // async fn claim_rewards(&self) -> ClaimRewardResult {
    //     let nns_rewards_canister_id = read_state(|state| state.data.nns_rewards_canister_id);
    //     self.claim_nns_rewards(Account {
    //         owner: Some(nns_rewards_canister_id),
    //         subaccount: None,
    //     })
    //     .await
    // }

    pub async fn manage_nns_neuron_impl(
        &self,
        neuron_id: u64,
        command: Command,
    ) -> Result<String, String> {
        let args = ManageNeuron::new(neuron_id, command);

        match nns_governance_canister_c2c_client::manage_neuron(
            self.get_nns_governance_canister_id(),
            &args,
        )
        .await
        {
            Ok(response) => {
                info!("Succesfully executed a neuron command: {:?}", response);
                Ok(("Succesfully executed a neuron command").to_string())
            }
            Err(e) => {
                error!("Failed to executed a neuron command: {:?}", e);
                Err(("Failed to executed a neuron command: {e:?}").to_string())
            }
        }
    }

    pub async fn stake_nns_neuron(
        &self,
        amount: u64,
        add_disolve_delay_secs: Option<u32>,
    ) -> Result<u64, String> {
        ic_cdk::println!("[stake_nns_neuron] Starting with amount: {}", amount);

        let nonce = generate_rand_nonce().await?;
        ic_cdk::println!("[stake_nns_neuron] Generated nonce: {}", nonce);

        let icp_ledger_canister_id = self.get_nns_ledger_canister_id();
        let nns_governance_canister_id = self.get_nns_governance_canister_id();
        let principal = ic_cdk::api::canister_self();
        ic_cdk::println!("[stake_nns_neuron] Principal: {}", principal);

        let subaccount = compute_neuron_staking_subaccount_bytes(principal, nonce);
        ic_cdk::println!("[stake_nns_neuron] Subaccount: {:?}", subaccount);

        let transfer = TransferArg {
            from_subaccount: None,
            to: Account {
                owner: nns_governance_canister_id,
                subaccount: Some(subaccount),
            },
            fee: Some((10_000u32).into()),
            created_at_time: None,
            memo: Some(nonce.into()),
            amount: amount.into(),
        };

        ic_cdk::println!(
            "[stake_nns_neuron] Sending {} ICP to {} with memo {}",
            amount,
            nns_governance_canister_id,
            nonce
        );

        icrc_ledger_canister_c2c_client::icrc1_transfer(icp_ledger_canister_id, &transfer)
            .await
            .map_err(|e| {
                let err = format!("[stake_nns_neuron] ICP transfer network error: {e:?}");
                ic_cdk::println!("{err}");
                err
            })?
            .map_err(|e| {
                let err = format!("[stake_nns_neuron] ICP transfer error: {e:?}");
                ic_cdk::println!("{err}");
                err
            })?;

        ic_cdk::println!("[stake_nns_neuron] Transfer successful. Claiming neuron...");

        let neuron_id = match nns_governance_canister_c2c_client::manage_neuron(
            nns_governance_canister_id,
            &(ManageNeuron {
                id: None,
                neuron_id_or_subaccount: None,
                command: Some(Command::ClaimOrRefresh(ClaimOrRefresh {
                    by: Some(By::MemoAndController(MemoAndController {
                        controller: Some(principal),
                        memo: nonce,
                    })),
                })),
            }),
        )
        .await
        {
            Ok(response) => match response.command {
                Some(manage_neuron_response::Command::ClaimOrRefresh(c)) => {
                    let neuron_id = c.refreshed_neuron_id.unwrap();
                    ic_cdk::println!(
                        "[stake_nns_neuron] Neuron claimed successfully: {:?}",
                        neuron_id
                    );
                    neuron_id
                }
                response => {
                    let err = format!("[stake_nns_neuron] Governance error: {response:?}");
                    ic_cdk::println!("{err}");
                    return Err(err);
                }
            },
            Err(error) => {
                let err =
                    format!("[stake_nns_neuron] Network error while claiming neuron: {error:?}");
                ic_cdk::println!("{err}");
                return Err(err);
            }
        };

        if let Some(additional_dissolve_delay_seconds) = add_disolve_delay_secs {
            ic_cdk::println!(
                "[stake_nns_neuron] Increasing dissolve delay by {}s for neuron: {:?}",
                additional_dissolve_delay_seconds,
                neuron_id
            );

            let response = nns_governance_canister_c2c_client::manage_neuron(
                nns_governance_canister_id,
                &(ManageNeuron {
                    id: Some(neuron_id.clone()),
                    neuron_id_or_subaccount: None,
                    command: Some(Command::Configure(
                        nns_governance_canister::types::manage_neuron::Configure {
                            operation: Some(
                                nns_governance_canister::types::manage_neuron::configure::Operation::IncreaseDissolveDelay(
                                    nns_governance_canister::types::manage_neuron::IncreaseDissolveDelay {
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
                let err_msg = format!(
                    "[stake_nns_neuron] Failed to increase dissolve delay: {:?}",
                    e
                );
                ic_cdk::println!("{err_msg}");
                err_msg
            })?;

            match response.command {
                Some(manage_neuron_response::Command::Configure(_)) => {
                    ic_cdk::println!(
                        "[stake_nns_neuron] Dissolve delay increased successfully for neuron: {:?}",
                        neuron_id
                    );
                }
                _ => {
                    let err_msg = format!(
                        "[stake_nns_neuron] Unexpected response while increasing dissolve delay: {:?}",
                        response
                    );
                    ic_cdk::println!("{err_msg}");
                    return Err(err_msg);
                }
            }
        }

        ic_cdk::println!("[stake_nns_neuron] Completed. Returning neuron ID.");
        Ok(neuron_id.id)
    }

    pub async fn get_available_nns_rewards(&self, threshold: Option<&Nat>) -> Nat {
        let threshold_u64 = threshold
            .map(|t| t.0.clone().try_into().unwrap_or(0))
            .unwrap_or(0);
        self.get_neurons()
            .all_neurons
            .iter()
            .filter(|neuron| {
                neuron.maturity_e8s_equivalent > 10_000_u64 // Cover transfer fee
                    && neuron.maturity_e8s_equivalent >= threshold_u64 // Meet threshold if provided
            })
            .fold(Nat::from(0_u64), |sum, neuron| {
                sum + neuron.maturity_e8s_equivalent
            })
    }

    pub fn get_neuron_metrics(&self) -> Vec<NnsNeuronWithMetric> {
        self.get_neurons()
            .all_neurons
            .iter()
            .map(|n| NnsNeuronWithMetric::from(n.clone()))
            .collect()
    }

    // NOTE: the methods disburses maturity into the most optimal way
    pub async fn disburse_maturity(&self, rewards_destination: Principal) -> Result<(), String> {
        // Sort neurons by available maturity descending
        let mut sorted_neurons: Vec<&Neuron> = self
            .neurons
            .all_neurons
            .iter()
            .filter(|n| n.id.is_some() && n.maturity_e8s_equivalent > 10_000) // NOTE: There should be enough maturity in the neuron to cover the transfer fee
            .collect();
        sorted_neurons.sort_by_key(|n| std::cmp::Reverse(n.maturity_e8s_equivalent));

        for neuron in sorted_neurons {
            let neuron_id = neuron.id.clone().unwrap();

            // Disburse maturity from current neuron
            disburse_neuron_maturity(
                self.get_nns_governance_canister_id(),
                neuron_id.clone(),
                Some(rewards_destination.into()),
                100,
            )
            .await?;
        }

        Ok(())
    }

    // NOTE: disburses maturity only from neurons that meet the individual threshold
    pub async fn disburse_maturity_from_eligible_neurons(
        &self,
        rewards_destination: Principal,
        threshold: &Nat,
    ) -> Result<(), String> {
        let threshold_u64 = threshold.0.clone().try_into().unwrap_or(0);

        // Sort neurons by available maturity descending, but only include those that meet the threshold
        let mut sorted_neurons: Vec<&Neuron> = self
            .neurons
            .all_neurons
            .iter()
            .filter(|n| {
                n.id.is_some()
                    && n.maturity_e8s_equivalent > 10_000 // Cover transfer fee
                    && n.maturity_e8s_equivalent >= threshold_u64 // Meet individual threshold
            })
            .collect();
        sorted_neurons.sort_by_key(|n| std::cmp::Reverse(n.maturity_e8s_equivalent));

        for neuron in sorted_neurons {
            let neuron_id = neuron.id.clone().unwrap();

            info!(
                "Disbursing {} e8s maturity from neuron {} (threshold: {} e8s)",
                neuron.maturity_e8s_equivalent, neuron_id.id, threshold_u64
            );

            // Disburse maturity from current neuron
            disburse_neuron_maturity(
                self.get_nns_governance_canister_id(),
                neuron_id.clone(),
                Some(rewards_destination.into()),
                100,
            )
            .await?;
        }

        Ok(())
    }
}

use sns_neuron_controller_api_canister::init::IcpManagerConfig;
impl From<IcpManagerConfig> for IcpManager {
    fn from(config: IcpManagerConfig) -> Self {
        IcpManager {
            nns_governance_canister_id: config.nns_governance_canister_id,
            nns_ledger_canister_id: config.nns_ledger_canister_id,
            neurons: Neurons::default(), // Initializes an empty neuron map
            icp_rewards_threshold: config.icp_rewards_threshold,
        }
    }
}
