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

use crate::types::icp_neuron_manager::IcpManager;
use crate::types::GoldaoManager;
#[derive(Serialize, Deserialize)]
pub struct NeuronManagersV0 {
    pub now: TimestampMillis,
    pub goldao: GoldaoManager,
    pub icp: IcpManager,
}
