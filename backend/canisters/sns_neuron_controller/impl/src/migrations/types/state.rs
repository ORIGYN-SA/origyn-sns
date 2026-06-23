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
}

#[derive(Serialize, Deserialize)]
pub struct NeuronManagersV0 {
    pub now: TimestampMillis,
    pub goldao: GoldaoManagerV0,
}

use crate::types::neurons::sns_neurons::Neurons;
use bity_ic_types::CanisterId;
use candid::CandidType;
use candid::Nat;
use std::collections::HashMap;
use types::TokenSymbol;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldaoManagerV0 {
    pub goldao_sns_governance_canister_id: CanisterId,
    pub goldao_sns_ledger_canister_id: CanisterId,
    pub goldao_sns_rewards_canister_id: CanisterId,
    pub neurons: Neurons,
    pub reward_tokens: HashMap<TokenSymbol, TokenParamsV0>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TokenParamsV0 {
    pub destination: Principal,
    pub threshold: u128,
}
