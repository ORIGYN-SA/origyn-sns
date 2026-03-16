use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct NeuronList {
    pub ogy_neurons: Vec<sns_governance_canister::types::Neuron>,
    pub goldao_neurons: Vec<sns_governance_canister::types::Neuron>,
    pub icp_neurons: Vec<nns_governance_canister::types::Neuron>,
}
