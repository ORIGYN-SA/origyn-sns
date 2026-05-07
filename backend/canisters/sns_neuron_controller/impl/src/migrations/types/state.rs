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
    pub goldao: GoldaoManagerV0,
    pub icp: IcpManagerV0,
}

use candid::CandidType;
use crate::types::neurons::sns_neurons::Neurons;
use candid::Nat;
use bity_ic_types::CanisterId;
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldaoManagerV0 {
    pub goldao_sns_governance_canister_id: CanisterId,
    pub goldao_sns_ledger_canister_id: CanisterId,
    pub goldao_sns_rewards_canister_id: CanisterId,
    pub neurons: Neurons,
    pub goldao_rewards_threshold: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct IcpManagerV0 {
    pub nns_governance_canister_id: CanisterId,
    pub nns_ledger_canister_id: CanisterId,
    pub neurons: Neurons,
    pub icp_rewards_threshold: Nat,
}
