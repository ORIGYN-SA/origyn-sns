use candid::CandidType;
use serde::{Deserialize, Serialize};

/// Desired configuration that the controller enforces on every SNS neuron it manages.
///
/// The daily neuron job compares each neuron against this policy and issues the
/// `manage_neuron` commands needed to converge, so the policy keeps holding even if
/// a neuron is reconfigured by hand.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct NeuronPolicy {
    /// Id (32 bytes) of the neuron that every managed neuron follows on all proposal topics.
    pub followee_neuron_id: Vec<u8>,
    /// Neurons left alone by the following and permission rules: the followee itself, and
    /// any neuron that is voted and administered by hand. Auto-stake still applies to them.
    pub exempt_neuron_ids: Vec<Vec<u8>>,
    /// When true, auto-stake maturity is switched on for every managed neuron
    /// (voting rewards are staked instead of accumulating as liquid maturity).
    pub auto_stake_maturity: bool,
    /// When true, every principal other than the controller is removed from the
    /// non-exempt neurons, so the DAO alone controls them. A permission the controller
    /// does not hold itself is never removed.
    pub exclusive_control: bool,
}
