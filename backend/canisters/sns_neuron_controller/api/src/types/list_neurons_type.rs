use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug, Clone)]
pub struct NeuronList {
    pub goldao_neurons: Vec<sns_governance_canister::types::Neuron>,
}
