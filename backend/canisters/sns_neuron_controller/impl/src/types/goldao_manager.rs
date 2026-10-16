use crate::state::read_state;
use crate::types::neuron_policy::PolicyEnforcementReport;
use crate::types::neurons::sns_neurons::Neurons;
use crate::types::sns_neuron_manager::{NeuronConfig, NeuronManager, NeuronRewardsManager};
use crate::utils::sns_rewards_calculate_available_rewards;
use crate::utils::sns_rewards_claim_rewards;
use crate::utils::ClaimRewardResult;
use async_trait::async_trait;
use candid::CandidType;
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use serde::{Deserialize, Serialize};
use sns_neuron_controller_api_canister::init::TokenParams;
use sns_neuron_controller_api_canister::neuron_policy::NeuronPolicy;
use sns_rewards_api_canister::subaccounts::REWARD_POOL_SUB_ACCOUNT_5Y;
use std::collections::HashMap;
use types::{CanisterId, TokenSymbol};

const MIN_THRESHOLD_FEE_MULTIPLIER: u64 = 100;

const PROD_DEX_INTERACTION: &str = "tss7g-syaaa-aaaai-axh4q-cai";
const PROD_SNS_REWARDS: &str = "yuijc-oiaaa-aaaap-ahezq-cai";
const PROD_GOVERNANCE: &str = "tr3th-kiaaa-aaaaq-aab6q-cai";

/// Gold DAO neuron that every ORIGYN neuron follows on all topics. It has no followees
/// itself and is voted by hand.
const PROD_FOLLOWEE_NEURON_ID: &str =
    "7eac04f2e207c04b8a7ac01b7505c715821ebbd7bc9815cef0a6842514f3b832";
/// Neurons whose following and permissions the controller never touches: the followee
/// above and the neuron that follows it by hand-made configuration. Both keep their
/// human principals; auto-stake still applies to them.
const PROD_EXEMPT_NEURON_IDS: [&str; 2] = [
    "85ba2947fa20016424330c3bf1ce123ab2f94c28e7bca0ce52760240e8c586b3",
    PROD_FOLLOWEE_NEURON_ID,
];

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldaoManager {
    pub goldao_sns_governance_canister_id: CanisterId,
    pub goldao_sns_ledger_canister_id: CanisterId,
    pub goldao_sns_rewards_canister_id: CanisterId,
    pub neurons: Neurons,
    pub reward_tokens: HashMap<TokenSymbol, TokenParams>,
    /// Following and maturity policy enforced by the daily job. None disables enforcement.
    #[serde(default)]
    pub neuron_policy: Option<NeuronPolicy>,
    /// Outcome of the last policy enforcement run.
    #[serde(default)]
    pub last_policy_enforcement: Option<PolicyEnforcementReport>,
}

impl GoldaoManager {
    pub fn new(is_test_mode: bool) -> Self {
        let (ledger_id, rewards_id, token_configs): (&str, &str, Vec<(TokenSymbol, &str)>) =
            if !is_test_mode {
                (
                    "tyyy3-4aaaa-aaaaq-aab7a-cai",
                    "iyehc-lqaaa-aaaap-ab25a-cai",
                    vec![
                        (TokenSymbol::GOLDAO, PROD_DEX_INTERACTION),
                        (TokenSymbol::OGY, PROD_SNS_REWARDS),
                        (TokenSymbol::ICP, PROD_DEX_INTERACTION),
                        (TokenSymbol::WTN, PROD_DEX_INTERACTION),
                        (TokenSymbol::GLDT, PROD_DEX_INTERACTION),
                    ],
                )
            } else {
                (
                    "irhm6-5yaaa-aaaap-ab24q-cai",
                    "rbv23-fqaaa-aaaam-qbfma-cai",
                    vec![
                        (TokenSymbol::GOLDAO, "jej56-sqaaa-aaaab-qgqkq-cai"),
                        (TokenSymbol::OGY, "fpmqz-aaaaa-aaaag-qjvua-cai"),
                        (TokenSymbol::ICP, "jej56-sqaaa-aaaab-qgqkq-cai"),
                        (TokenSymbol::WTN, "jej56-sqaaa-aaaab-qgqkq-cai"),
                        (TokenSymbol::GLDT, "jej56-sqaaa-aaaab-qgqkq-cai"),
                    ],
                )
            };

        let reward_tokens = token_configs
            .into_iter()
            .map(|(symbol, dest)| {
                let threshold: u128 = if is_test_mode {
                    0
                } else {
                    let fee = u128::try_from(symbol.get_prod_token_info().fee.0)
                        .expect("token fee should fit in u128");
                    fee * MIN_THRESHOLD_FEE_MULTIPLIER as u128
                };

                // Determine the subaccount based on the token symbol
                let subaccount = if symbol == TokenSymbol::OGY {
                    Some(REWARD_POOL_SUB_ACCOUNT_5Y)
                } else {
                    None
                };

                let destination = Account {
                    owner: Principal::from_text(dest).expect("Invalid Principal"),
                    subaccount,
                };

                (
                    symbol,
                    TokenParams {
                        destination,
                        threshold,
                    },
                )
            })
            .collect();

        Self {
            goldao_sns_governance_canister_id: Principal::from_text(PROD_GOVERNANCE).unwrap(),
            goldao_sns_ledger_canister_id: Principal::from_text(ledger_id).unwrap(),
            goldao_sns_rewards_canister_id: Principal::from_text(rewards_id).unwrap(),
            neurons: Neurons::default(),
            reward_tokens,
            neuron_policy: None,
            last_policy_enforcement: None,
        }
    }

    /// The policy adopted by ORIGYN DAO for its Gold DAO neurons: follow the hand-voted
    /// neuron on all seven topics, stake all voting rewards, and leave the controller as
    /// the only principal on every neuron except the two exempt ones.
    pub fn production_neuron_policy() -> NeuronPolicy {
        NeuronPolicy {
            followee_neuron_id: hex_to_bytes(PROD_FOLLOWEE_NEURON_ID),
            exempt_neuron_ids: PROD_EXEMPT_NEURON_IDS
                .iter()
                .map(|id| hex_to_bytes(id))
                .collect(),
            auto_stake_maturity: true,
            exclusive_control: true,
        }
    }

    fn get_sns_rewards_canister_id(&self) -> CanisterId {
        self.goldao_sns_rewards_canister_id
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
    fn get_neuron_policy(&self) -> Option<&NeuronPolicy> {
        self.neuron_policy.as_ref()
    }
    fn set_last_policy_enforcement(&mut self, report: PolicyEnforcementReport) {
        self.last_policy_enforcement = Some(report);
    }
}

#[async_trait]
impl NeuronManager for GoldaoManager {}

#[async_trait]
impl NeuronRewardsManager for GoldaoManager {
    fn get_reward_tokens(&self) -> HashMap<TokenSymbol, TokenParams> {
        self.reward_tokens.clone()
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
            reward_tokens: config.reward_tokens,
            neuron_policy: config.neuron_policy,
            last_policy_enforcement: None,
        }
    }
}

/// Decodes a hex string into bytes. Panics on malformed input, which is only ever a
/// compile-time constant here.
fn hex_to_bytes(hex: &str) -> Vec<u8> {
    assert!(
        hex.len().is_multiple_of(2),
        "hex string must have an even length"
    );
    (0..hex.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).expect("invalid hex digit"))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn production_policy_decodes_neuron_ids() {
        let policy = GoldaoManager::production_neuron_policy();
        assert_eq!(policy.followee_neuron_id.len(), 32);
        assert_eq!(policy.followee_neuron_id[0], 0x7e);
        assert_eq!(policy.followee_neuron_id[31], 0x32);
        assert_eq!(policy.exempt_neuron_ids.len(), 2);
        assert!(policy
            .exempt_neuron_ids
            .contains(&policy.followee_neuron_id));
        assert_eq!(policy.exempt_neuron_ids[0][0], 0x85);
        assert!(policy.auto_stake_maturity);
        assert!(policy.exclusive_control);
    }
}
