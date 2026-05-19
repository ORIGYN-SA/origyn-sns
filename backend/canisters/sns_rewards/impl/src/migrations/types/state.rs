use crate::model::neuron_system::NeuronSystem;
use crate::state::Data;
use crate::state::SyncInfo;
use crate::{
    model::{maturity_history::MaturityHistory, payment_processor::PaymentProcessor},
    utils::TimeInterval,
};
use candid::{Nat, Principal};
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::NeuronId;
use sns_rewards_api_canister::{ReserveTokenAmounts, TokenRewardTypes};
use std::collections::BTreeMap;
use std::collections::HashMap;
use types::TokenInfo;
use types::TokenSymbol;
use types::TokenSymbolV0;
use types::{NeuronInfo, TimestampMillis};
use utils::env::CanisterEnvV0;
use sns_rewards_api_canister::payment_round::PaymentRoundV0;

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    pub env: CanisterEnvV0,
    pub data: DataV0,
}

#[derive(Serialize, Deserialize)]
pub struct DataV0 {
    pub sns_governance_canister: Principal,
    pub neuron_maturity: BTreeMap<NeuronId, NeuronInfoV0>,
    pub sync_info: SyncInfo,
    pub maturity_history: MaturityHistory,
    pub payment_processor: PaymentProcessorV0,
    pub tokens: TokenRewardTypesV0,
    pub authorized_principals: Vec<Principal>,
    pub is_synchronizing_neurons: bool,
    pub daily_reserve_transfer: ReserveTokenAmountsV0,
    pub last_daily_reserve_transfer_time: TimestampMillis,
    pub daily_ogy_burn_rate: Option<Nat>,
    pub last_daily_ogy_burn: Option<TimestampMillis>,
    pub reward_distribution_interval: Option<TimeInterval>,
    pub reward_distribution_in_progress: Option<bool>,
    pub neuron_sync_interval: Option<TimeInterval>,
}

impl From<DataV0> for Data {
    fn from(v0: DataV0) -> Self {
        let mut tokens: TokenRewardTypes = TokenRewardTypes::new();

        for (symbol_v0, info) in v0.tokens {
            match TokenSymbol::parse(&symbol_v0.0) {
                Ok(symbol) => {
                    tokens.insert(symbol, info);
                }
                Err(e) => {
                    panic!("Failed to parse token symbol '{}': {:?}", symbol_v0.0, e);
                }
            }
        }

        // // NOTE: add support of WTN (?)
        // tokens.insert(TokenSymbol::WTN, TokenSymbol::WTN.get_token_info());

        // Convert daily_reserve_transfer keys from TokenIdentifierV0 -> TokenSymbol
        let mut daily_reserve_transfer: ReserveTokenAmounts = HashMap::new();

        for (symbol_v0, amount) in v0.daily_reserve_transfer {
            match TokenSymbol::parse(&symbol_v0.0) {
                Ok(symbol) => {
                    daily_reserve_transfer.insert(symbol, amount);
                }
                Err(e) => {
                    panic!(
                        "Failed to parse token symbol in daily_reserve_transfer '{}': {:?}",
                        symbol_v0.0, e
                    );
                }
            }
        }

        let neuron_maturity: BTreeMap<_, _> = v0
            .neuron_maturity
            .into_iter()
            .map(|(k, v)| (k, NeuronInfo::from(v)))
            .collect();

        Data {
            sns_governance_canister: v0.sns_governance_canister,
            neuron_system: NeuronSystem {
                sync_info: v0.sync_info,
                neuron_maturity: neuron_maturity.clone(),
                neuron_maturity_5y: neuron_maturity,
                maturity_history: MaturityHistory::default(),
            },
            payment_processor: PaymentProcessor::from(v0.payment_processor),
            tokens,
            authorized_principals: v0.authorized_principals,
            is_synchronizing_neurons: v0.is_synchronizing_neurons,
            daily_reserve_transfer,
            last_daily_reserve_transfer_time: v0.last_daily_reserve_transfer_time,
            daily_ogy_burn_rate: v0.daily_ogy_burn_rate,
            last_daily_ogy_burn: v0.last_daily_ogy_burn,
            reward_distribution_interval: v0.reward_distribution_interval,
            reward_distribution_in_progress: v0.reward_distribution_in_progress,
            neuron_sync_interval: v0.neuron_sync_interval,
        }
    }
}

#[derive(Serialize, Clone, Deserialize, Debug, PartialEq, Eq)]
pub struct NeuronInfoV0 {
    pub last_synced_maturity: u64,
    pub accumulated_maturity: u64,
    pub rewarded_maturity: HashMap<TokenSymbolV0, u64>,
    pub last_disburse_event_considered: Option<TimestampMillis>,
}

impl From<NeuronInfoV0> for NeuronInfo {
    fn from(v0: NeuronInfoV0) -> Self {
        let mut rewarded_maturity: HashMap<TokenSymbol, u64> = HashMap::new();

        for (symbol_v0, amount) in v0.rewarded_maturity {
            match TokenSymbol::parse(&symbol_v0.0) {
                Ok(symbol) => {
                    rewarded_maturity.insert(symbol, amount);
                }
                Err(e) => {
                    panic!(
                        "Failed to parse token symbol in rewarded_maturity '{}': {:?}",
                        symbol_v0.0, e
                    );
                }
            }
        }

        NeuronInfo {
            last_synced_maturity: v0.last_synced_maturity,
            accumulated_maturity: v0.accumulated_maturity,
            rewarded_maturity,
            last_disburse_event_considered: v0.last_disburse_event_considered,
        }
    }
}

pub type ReserveTokenAmountsV0 = HashMap<TokenSymbolV0, Nat>;
pub type TokenRewardTypesV0 = HashMap<TokenSymbolV0, TokenInfo>;

use crate::memory::VM;
use ic_stable_structures::StableBTreeMap;
use sns_rewards_api_canister::payment_round::PaymentRound;
#[derive(Serialize, Deserialize)]
pub struct PaymentProcessorV0 {
    #[serde(skip, default = "init_map_v0")]
    pub round_history_v0: StableBTreeMap<(TokenSymbolV0, u16), PaymentRoundV0, VM>,
    /// Holds only PaymentRounds that are FULLY completed.
    #[serde(skip, default = "init_map")]
    pub round_history: StableBTreeMap<(TokenSymbol, u16), PaymentRound, VM>,
    /// Holds active PaymentRounds that are being processed
    pub active_rounds: BTreeMap<TokenSymbol, PaymentRound>,
}

use crate::memory::get_payment_round_history_memory_v0;
fn init_map_v0() -> StableBTreeMap<(TokenSymbolV0, u16), PaymentRoundV0, VM> {
    let memory = get_payment_round_history_memory_v0();
    StableBTreeMap::init(memory)
}

use crate::memory::get_payment_round_history_memory;
fn init_map() -> StableBTreeMap<(TokenSymbol, u16), PaymentRound, VM> {
    let memory = get_payment_round_history_memory();
    StableBTreeMap::init(memory)
}

impl From<PaymentProcessorV0> for PaymentProcessor {
    fn from(v0: PaymentProcessorV0) -> Self {
        let next_key = next_key(v0.round_history_v0);

        PaymentProcessor {
            active_rounds: v0.active_rounds,
            active_rounds_5y: BTreeMap::new(),
            round_history_v0: init_map_v0(),
            round_history: init_map(),
            next_key,
        }
    }
}

pub fn next_key(round_history: StableBTreeMap<(TokenSymbolV0, u16), PaymentRoundV0, VM>) -> u16 {
    let mut max_key = 0;
    for entry in round_history.iter() {
        let (_, id) = entry.key();
        if *id > max_key {
            max_key = *id;
        }
    }

    if max_key == u16::MAX {
        1
    } else {
        max_key + 1
    }
}
