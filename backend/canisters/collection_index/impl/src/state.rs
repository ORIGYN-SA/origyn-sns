use candid::{ CandidType, Principal };
use collection_index_api::stats::OverallStats;
use serde::{ Deserialize as SerdeDeserialize, Serialize };
use types::TimestampMillis;
use utils::{ env::{ CanisterEnv, Environment }, memory::MemorySize };
use canister_state_macros::canister_state;
use ic_cdk::api::is_controller;

use crate::model::collection::CollectionModel;

canister_state!(RuntimeState);

#[derive(Serialize, SerdeDeserialize)]
pub struct RuntimeState {
    /// Runtime environment
    pub env: CanisterEnv,
    /// Runtime data
    pub data: Data,
}

impl RuntimeState {
    pub fn new(env: CanisterEnv, data: Data) -> Self {
        Self { env, data }
    }

    pub fn metrics(&self) -> Metrics {
        Metrics {
            canister_info: CanisterInfo {
                now: self.env.now(),
                test_mode: self.env.is_test_mode(),
                memory_used: MemorySize::used(),
                cycles_balance_in_tc: self.env.cycles_balance_in_tc(),
            },
            total_collections: self.data.collections.total_collections(),
        }
    }

    pub fn is_caller_authorised_principal(&self) -> bool {
        let caller = self.env.caller();
        if is_controller(&caller) {
            return true;
        }
        self.data.authorised_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    pub total_collections: u64,
}

#[derive(CandidType, Serialize, SerdeDeserialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: f64,
}
#[derive(Serialize, SerdeDeserialize)]
pub struct Data {
    /// Authorised principals for guarded calls
    pub authorised_principals: Vec<Principal>,
    /// collection of nft canisters
    pub collections: CollectionModel,
    /// Overall computed stats
    pub overall_stats: OverallStats,
}

impl Data {
    pub fn new(authorised_principals: Vec<Principal>) -> Self {
        Self {
            collections: CollectionModel::default(),
            authorised_principals,
            overall_stats: OverallStats::default(),
        }
    }
}
