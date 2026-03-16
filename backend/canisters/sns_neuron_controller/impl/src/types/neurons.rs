use serde::Deserialize;
use types::TimestampMillis;

pub mod nns_neurons {
    use super::*;

    use candid::CandidType;
    use icrc_ledger_types::icrc1::account::Account;
    use ledger_utils::icrc_account_to_legacy_account_id;
    use nns_governance_canister::types::{neuron::DissolveState, Neuron};
    use serde::Serialize;
    use utils::consts::NNS_GOVERNANCE_CANISTER_ID;

    #[derive(CandidType, Serialize, Deserialize, Default, Clone)]
    pub struct Neurons {
        pub timestamp: TimestampMillis,
        pub all_neurons: Vec<Neuron>,
    }

    // AsRef for immutable access to the slice of neurons
    impl AsRef<[Neuron]> for Neurons {
        fn as_ref(&self) -> &[Neuron] {
            &self.all_neurons
        }
    }

    // AsMut for mutable access to the slice of neurons
    impl AsMut<[Neuron]> for Neurons {
        fn as_mut(&mut self) -> &mut [Neuron] {
            &mut self.all_neurons
        }
    }

    #[derive(CandidType, Serialize, Debug, PartialEq, Eq)]
    pub struct NnsNeuronWithMetric {
        pub id: u64,
        pub deposit_account: Option<DepositAccount>,
        pub staked_amount: u64,
        pub maturity: u64,
        pub dissolve_delay: u64,
        pub dissolving: bool,
        pub voting_power_refreshed_timestamp_seconds: Option<u64>,
    }

    impl From<Neuron> for NnsNeuronWithMetric {
        fn from(neuron: Neuron) -> Self {
            let mut dissolve_delay = 0u64;
            let mut dissolving = false;

            if let Some(dissolve_info) = neuron.dissolve_state {
                match dissolve_info {
                    DissolveState::WhenDissolvedTimestampSeconds(ts) => {
                        dissolving = true;
                        dissolve_delay = ts;
                    }
                    DissolveState::DissolveDelaySeconds(ts) => {
                        dissolve_delay = ts;
                    }
                }
            }

            let subaccount_bytes: Result<[u8; 32], _> = neuron.account.try_into();
            let deposit_account = match subaccount_bytes {
                Ok(bytes) => {
                    let icrc_account = Account {
                        owner: NNS_GOVERNANCE_CANISTER_ID,
                        subaccount: Some(bytes),
                    };
                    let legacy_account_id =
                        icrc_account_to_legacy_account_id(icrc_account).to_hex();
                    Some(DepositAccount {
                        icrc_account,
                        legacy_account_id,
                    })
                }
                Err(_) => None,
            };
            Self {
                id: neuron.id.map_or(0, |id| id.id),
                deposit_account,
                staked_amount: neuron.cached_neuron_stake_e8s,
                maturity: neuron.maturity_e8s_equivalent,
                dissolve_delay,
                dissolving,
                voting_power_refreshed_timestamp_seconds: neuron
                    .voting_power_refreshed_timestamp_seconds,
            }
        }
    }

    #[derive(CandidType, Serialize, Debug, PartialEq, Eq)]
    pub struct DepositAccount {
        icrc_account: Account,
        legacy_account_id: String,
    }

    use candid::Principal;
    use nns_governance_canister::types::manage_neuron::Command;
    use nns_governance_canister::types::manage_neuron::DisburseMaturity;
    use nns_governance_canister::types::ManageNeuron;
    use nns_governance_canister::types::NeuronId;
    use tracing::{error, info};
    pub async fn disburse_neuron_maturity(
        nns_governance_canister_id: Principal,
        neuron_id: NeuronId,
        to_account: Option<Account>,
        percentage_to_disburse: u32,
    ) -> Result<(), String> {
        let manage_neuron = ManageNeuron {
            id: Some(neuron_id.clone()),
            neuron_id_or_subaccount: None,
            command: Some(Command::DisburseMaturity(DisburseMaturity {
                percentage_to_disburse,
                to_account: to_account.clone(),
            })),
        };
        match nns_governance_canister_c2c_client::manage_neuron(
            nns_governance_canister_id,
            manage_neuron,
        )
        .await
        {
            Ok(manage_neuron_response) => match manage_neuron_response.command {
                Some(
                    nns_governance_canister::types::manage_neuron_response::Command::DisburseMaturity(
                        response,
                    ),
                ) => {
                    info!("Successfully disbursed maturity for neuron {:?}", response);
                    Ok(())
                }
                Some(response) => {
                    let error_msg = format!("Unexpected response from manage_neuron: {:?}", response);
                    error!("{}", error_msg);
                    return Err(error_msg);
                }
                None => {
                    let error_msg = "manage_neuron response contained no command.".to_string();
                    error!("{}", &error_msg);
                    return Err(error_msg);
                }
            },
            Err(e) => {
                let error_msg = format!(
                    "Failed to disburse maturity for neuron {:?}: {:?}",
                    neuron_id, e
                );
                error!("{}", &error_msg);
                return Err(error_msg);
            }
        }
    }
}

pub mod sns_neurons {
    use super::*;
    use candid::CandidType;
    use icrc_ledger_types::icrc1::account::Account;
    use serde::Serialize;
    use sns_governance_canister::types::{neuron::DissolveState, Neuron};
    use types::CanisterId;

    #[derive(CandidType, Serialize, Deserialize, Default, Clone, Debug)]
    pub struct Neurons {
        pub timestamp: TimestampMillis,
        pub all_neurons: Vec<Neuron>,
    }

    // AsRef for immutable access to the slice of neurons
    impl AsRef<[Neuron]> for Neurons {
        fn as_ref(&self) -> &[Neuron] {
            &self.all_neurons
        }
    }

    // AsMut for mutable access to the slice of neurons
    impl AsMut<[Neuron]> for Neurons {
        fn as_mut(&mut self) -> &mut [Neuron] {
            &mut self.all_neurons
        }
    }

    #[derive(CandidType, Serialize, Debug, PartialEq, Eq)]
    pub struct DepositAccount {
        icrc_account: Account,
        icrc_account_as_string: String,
    }

    #[derive(CandidType, Serialize, Debug, PartialEq, Eq)]
    pub struct SnsNeuronWithMetric {
        pub id: Vec<u8>,
        pub deposit_account: DepositAccount,
        pub staked_amount: u64,
        pub maturity: u64,
        pub dissolve_delay: u64,
        pub dissolving: bool,
    }

    impl SnsNeuronWithMetric {
        pub fn from_neuron_with_sns_gov_id(
            neuron: Neuron,
            sns_governance_canister_id: CanisterId,
        ) -> Self {
            let mut dissolve_delay = 0u64;
            let mut dissolving = false;

            if let Some(dissolve_info) = neuron.dissolve_state {
                match dissolve_info {
                    DissolveState::WhenDissolvedTimestampSeconds(ts) => {
                        dissolving = true;
                        dissolve_delay = ts;
                    }
                    DissolveState::DissolveDelaySeconds(ts) => {
                        dissolve_delay = ts;
                    }
                }
            }

            let subaccount_bytes: [u8; 32] = neuron.id.clone().unwrap_or_default().into();
            let icrc_account = Account {
                owner: sns_governance_canister_id,
                subaccount: Some(subaccount_bytes),
            };
            let deposit_account = DepositAccount {
                icrc_account,
                icrc_account_as_string: icrc_account.to_string(),
            };

            Self {
                id: neuron.id.map_or(vec![0; 32], |id| id.id),
                deposit_account,
                staked_amount: neuron.cached_neuron_stake_e8s,
                maturity: neuron.maturity_e8s_equivalent,
                dissolve_delay,
                dissolving,
            }
        }
    }
}
