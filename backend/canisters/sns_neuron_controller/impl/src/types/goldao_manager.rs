use crate::state::read_state;
use crate::types::neurons::sns_neurons::Neurons;
use crate::types::sns_neuron_manager::{NeuronConfig, NeuronManager, NeuronRewardsManager};
use crate::utils::sns_rewards_calculate_available_rewards;
use crate::utils::sns_rewards_claim_rewards;
use crate::utils::ClaimRewardResult;
use async_trait::async_trait;
use candid::CandidType;
use candid::{Nat, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use types::{CanisterId, TokenSymbol};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldaoManager {
    pub goldao_sns_governance_canister_id: CanisterId,
    pub goldao_sns_ledger_canister_id: CanisterId,
    pub goldao_sns_rewards_canister_id: CanisterId,
    pub neurons: Neurons,
    pub goldao_rewards_threshold: Nat,
    /// Maps each reward token to its distribution destination
    pub reward_tokens: HashMap<TokenSymbol, Principal>,
}

// NOTE: ic network parameters
impl Default for GoldaoManager {
    fn default() -> Self {
        let mut reward_tokens = HashMap::new();
        reward_tokens.insert(TokenSymbol::GOLDAO, Principal::from_text("xevnm-giaaa-aaaaq-aab5q-cai").unwrap());
        reward_tokens.insert(TokenSymbol::OGY, Principal::from_text("xevnm-giaaa-aaaaq-aab5q-cai").unwrap());
        reward_tokens.insert(TokenSymbol::ICP, Principal::from_text("xevnm-giaaa-aaaaq-aab5q-cai").unwrap());
        reward_tokens.insert(TokenSymbol::WTN, Principal::from_text("xevnm-giaaa-aaaaq-aab5q-cai").unwrap());
        
        Self {
            goldao_sns_governance_canister_id: Principal::from_text("tr3th-kiaaa-aaaaq-aab6q-cai")
                .unwrap(),
            goldao_sns_ledger_canister_id: Principal::from_text("tyyy3-4aaaa-aaaaq-aab7a-cai")
                .unwrap(),
            goldao_sns_rewards_canister_id: Principal::from_text("iyehc-lqaaa-aaaap-ab25a-cai")
                .unwrap(),
            neurons: Neurons::default(),
            goldao_rewards_threshold: Nat::from(3_000_000_000_000_u64), // 30'000 GOLDAO
            reward_tokens,
        }
    }
}

impl NeuronConfig for GoldaoManager {
    fn get_sns_governance_canister_id(&self) -> CanisterId {
        self.goldao_sns_governance_canister_id
    }
    fn get_sns_ledger_canister_id(&self) -> CanisterId {
        self.goldao_sns_ledger_canister_id
    }
    fn get_neurons(&self) -> &Neurons {
        &self.neurons
    }
    fn get_neurons_mut(&mut self) -> &mut Neurons {
        &mut self.neurons
    }
}

impl GoldaoManager {
    fn get_sns_rewards_canister_id(&self) -> CanisterId {
        self.goldao_sns_rewards_canister_id
    }
}

#[async_trait]
impl NeuronManager for GoldaoManager {}

#[async_trait]
impl NeuronRewardsManager for GoldaoManager {
    fn get_reward_tokens(&self) -> HashMap<TokenSymbol, Principal> {
        self.reward_tokens.clone()
    }

    fn get_rewards_threshold(&self, _token: TokenSymbol) -> Nat {
        self.goldao_rewards_threshold.clone()
    }

    async fn get_available_rewards(&self, token: TokenSymbol) -> Nat {
        let neurons = self.get_neurons().as_ref();
        let sns_rewards_canister_id = self.get_sns_rewards_canister_id();
        let is_test_mode = read_state(|s| s.env.is_test_mode());
        sns_rewards_calculate_available_rewards(
            neurons,
            sns_rewards_canister_id,
            token.ledger_id(is_test_mode),
        )
        .await
        .get_internal()
    }

    async fn claim_rewards(&self, token: TokenSymbol) -> ClaimRewardResult {
        let neurons = self.get_neurons().as_ref();
        sns_rewards_claim_rewards(neurons, self.get_sns_rewards_canister_id(), token.symbol()).await
    }
}

use sns_neuron_controller_api_canister::init::GoldaoManagerConfig;
impl From<GoldaoManagerConfig> for GoldaoManager {
    fn from(config: GoldaoManagerConfig) -> Self {
        GoldaoManager {
            goldao_sns_governance_canister_id: config.goldao_sns_governance_canister_id,
            goldao_sns_ledger_canister_id: config.goldao_sns_ledger_canister_id,
            goldao_sns_rewards_canister_id: config.goldao_sns_rewards_canister_id,
            neurons: Neurons::default(),
            goldao_rewards_threshold: config.goldao_rewards_threshold,
            reward_tokens: config.reward_tokens,
        }
    }
}
