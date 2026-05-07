use crate::types::neurons::sns_neurons::SnsNeuronWithMetric;
use crate::types::sns_neuron_manager::NeuronManager;
use crate::types::sns_neuron_manager::NeuronManagerEnum;
use crate::types::GoldaoManager;
use bity_ic_canister_state_macros::canister_state;
use bity_ic_types::BuildVersion;
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::Neuron;
use sns_neuron_controller_api_canister::init::GoldaoManagerConfig;
use sns_neuron_controller_api_canister::neuron_type::NeuronType;
use types::TimestampMillis;
use utils::{
    env::{CanisterEnv, Environment},
    memory::MemorySize,
};

canister_state!(RuntimeState);

#[derive(Serialize, Deserialize)]
pub struct RuntimeState {
    pub env: CanisterEnv,
    pub data: Data,
}

impl RuntimeState {
    pub fn new(env: CanisterEnv, data: Data) -> Self {
        Self { env, data }
    }
    pub fn metrics(&self) -> Metrics {
        Metrics {
            canister_info: CanisterInfo {
                now: self.env.now(),
                version: self.env.version(),
                commit_hash: self.env.commit_hash().to_string(),
                test_mode: self.env.is_test_mode(),
                memory_used: MemorySize::used(),
                cycles_balance_in_tc: self.env.cycles_balance_in_tc(),
            },
            authorized_principals: self.data.authorized_principals.clone(),
            goldao_neuron_manager_metrics: self.data.neuron_managers.goldao.get_neuron_metrics(),
        }
    }

    pub fn is_caller_governance_principal(&self) -> bool {
        let caller = self.env.caller();
        self.data.authorized_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    pub authorized_principals: Vec<Principal>,
    pub goldao_neuron_manager_metrics: Vec<SnsNeuronWithMetric>,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub version: BuildVersion,
    pub commit_hash: String,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: u128,
}

#[derive(Serialize, Deserialize)]
pub struct Data {
    pub authorized_principals: Vec<Principal>,
    pub neuron_managers: NeuronManagers,
}

impl Data {
    pub fn new(
        authorized_principals: Vec<Principal>,
        goldao_manager_config: GoldaoManagerConfig,
        now: TimestampMillis,
    ) -> Self {
        Self {
            authorized_principals,
            neuron_managers: NeuronManagers::init(goldao_manager_config, now),
        }
    }
}

#[derive(Serialize, Deserialize, Default)]
pub struct NeuronManagers {
    pub now: TimestampMillis,
    pub goldao: GoldaoManager,
    // pub icp: IcpManager,
}

impl NeuronManagers {
    pub fn init(goldao_manager_config: GoldaoManagerConfig, now: TimestampMillis) -> Self {
        Self {
            now,
            goldao: goldao_manager_config.into(),
            // icp: icp_manager_config.into(),
            // wtn: wtn_manager_config.into(),
        }
    }

    pub fn get_neurons(&self) -> NeuronList {
        NeuronList {
            goldao_neurons: self.goldao.neurons.all_neurons.clone(),
        }
    }

    pub fn get_neuron_manager(&self, neuron_type: NeuronType) -> NeuronManagerEnum {
        match neuron_type {
            NeuronType::GOLDAO => NeuronManagerEnum::GoldaoManager(self.goldao.clone()),
        }
    }
}

#[derive(CandidType, Serialize)]
pub struct NeuronList {
    goldao_neurons: Vec<Neuron>,
}
