use crate::types::neurons::sns_neurons::Neurons;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    pub env: CanisterEnv,
    pub data: Data,
}

#[derive(Serialize, Deserialize)]
pub struct CanisterEnv {
    test_mode: bool,
}

impl CanisterEnv {
    pub fn is_test_mode(&self) -> bool {
        self.test_mode
    }
}

use candid::Principal;
use types::TimestampMillis;

#[derive(Serialize, Deserialize)]
pub struct Data {
    pub authorized_principals: Vec<Principal>,
    pub neuron_managers: NeuronManagersV0,
    pub rewards_destination: Option<Principal>,
}

#[derive(Serialize, Deserialize)]
pub struct NeuronManagersV0 {
    pub now: TimestampMillis,
    pub ogy: OgyManagerV0,
}

#[derive(Serialize, Deserialize)]
pub struct OgyManagerV0 {
    pub ogy_sns_governance_canister_id: Principal,
    pub ogy_sns_ledger_canister_id: Principal,
    pub ogy_sns_rewards_canister_id: Principal,
    pub neurons: Neurons,
}
