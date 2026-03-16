use crate::types::neurons::sns_neurons::Neurons;
use crate::types::sns_neuron_manager::{NeuronConfig, NeuronManager, NeuronRewardsManager};
use crate::utils::sns_rewards_calculate_available_rewards;
use crate::utils::sns_rewards_claim_rewards;
use crate::utils::ClaimRewardResult;
use async_trait::async_trait;
use candid::CandidType;
use candid::{Nat, Principal};
use serde::{Deserialize, Serialize};
use types::CanisterId;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct OgyManager {
    pub ogy_sns_governance_canister_id: CanisterId,
    pub ogy_sns_ledger_canister_id: CanisterId,
    pub ogy_sns_rewards_canister_id: CanisterId,
    pub neurons: Neurons,
    pub ogy_rewards_threshold: Nat,
}

// NOTE: ic network parameters
impl Default for OgyManager {
    fn default() -> Self {
        Self {
            ogy_sns_governance_canister_id: Principal::from_text("lnxxh-yaaaa-aaaaq-aadha-cai")
                .unwrap(),
            ogy_sns_ledger_canister_id: Principal::from_text("lkwrt-vyaaa-aaaaq-aadhq-cai")
                .unwrap(),
            ogy_sns_rewards_canister_id: Principal::from_text("yuijc-oiaaa-aaaap-ahezq-cai")
                .unwrap(),
            neurons: Neurons::default(),
            ogy_rewards_threshold: Nat::from(100_000_000_000_000_u64), // 1_000_000 OGY
        }
    }
}

impl NeuronConfig for OgyManager {
    fn get_sns_governance_canister_id(&self) -> CanisterId {
        self.ogy_sns_governance_canister_id
    }
    fn get_sns_ledger_canister_id(&self) -> CanisterId {
        self.ogy_sns_ledger_canister_id
    }
    fn get_neurons(&self) -> &Neurons {
        &self.neurons
    }
    fn get_neurons_mut(&mut self) -> &mut Neurons {
        &mut self.neurons
    }
}

impl OgyManager {
    fn get_sns_rewards_canister_id(&self) -> CanisterId {
        self.ogy_sns_rewards_canister_id
    }
}

#[async_trait]
impl NeuronManager for OgyManager {}

#[async_trait]
impl NeuronRewardsManager for OgyManager {
    fn get_rewards_threshold(&self) -> Nat {
        self.ogy_rewards_threshold.clone()
    }

    async fn get_available_rewards(&self) -> Nat {
        let neurons = self.get_neurons().as_ref();
        sns_rewards_calculate_available_rewards(
            neurons,
            self.get_sns_rewards_canister_id(),
            self.get_sns_ledger_canister_id(),
        )
        .await
        .get_internal()
    }

    async fn claim_rewards(&self) -> ClaimRewardResult {
        let neurons = self.get_neurons().as_ref();
        sns_rewards_claim_rewards(neurons, self.get_sns_rewards_canister_id(), "OGY").await
    }
}

use sns_neuron_controller_api_canister::init::OgyManagerConfig;
impl From<OgyManagerConfig> for OgyManager {
    fn from(config: OgyManagerConfig) -> Self {
        OgyManager {
            ogy_sns_governance_canister_id: config.ogy_sns_governance_canister_id,
            ogy_sns_ledger_canister_id: config.ogy_sns_ledger_canister_id,
            ogy_sns_rewards_canister_id: config.ogy_sns_rewards_canister_id,
            neurons: Neurons::default(), // Initializes an empty neuron map
            ogy_rewards_threshold: config.ogy_rewards_threshold,
        }
    }
}
