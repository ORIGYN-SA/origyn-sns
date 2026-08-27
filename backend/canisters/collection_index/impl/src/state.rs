use bity_ic_canister_state_macros::canister_state;
use bity_ic_types::BuildVersion;
use candid::{CandidType, Principal};
use collection_index_api::stats::OverallStats;
use ic_cdk::api::is_controller;
use serde::{Deserialize as SerdeDeserialize, Serialize};
use std::collections::HashMap;
use types::TimestampMillis;
use crate::model::gold_collections::GoldCollectionsConfig;
use utils::{
    env::{CanisterEnv, Environment},
    memory::MemorySize,
};

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
                version: self.env.version(),
                commit_hash: self.env.commit_hash().to_string(),
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

    pub fn get_is_syncing_collections(&self) -> bool {
        self.data.is_syncing_collections
    }

    pub fn set_is_syncing_collections(&mut self, val: bool) {
        self.data.is_syncing_collections = val;
    }

    pub fn get_is_syncing_supplies(&self) -> bool {
        self.data.is_syncing_supplies
    }

    pub fn set_is_syncing_supplies(&mut self, val: bool) {
        self.data.is_syncing_supplies = val;
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
    pub cycles_balance_in_tc: u128,
    pub version: BuildVersion,
    pub commit_hash: String,
}

#[derive(Serialize, SerdeDeserialize)]
pub struct Data {
    /// Authorised principals for guarded calls
    pub authorised_principals: Vec<Principal>,
    /// collection of nft canisters
    pub collections: CollectionModel,
    #[serde(default)]
    pub gold_collections_config: GoldCollectionsConfig,
    /// Overall computed stats
    pub overall_stats: OverallStats,
    /// The claimlink canister that owns the source-of-truth list of collections
    #[serde(default = "Principal::anonymous")]
    pub claimlink_canister_id: Principal,
    /// Check if we are currently syncing collections
    #[serde(default)]
    pub is_syncing_collections: bool,
    /// Check if we are currently syncing supplies
    #[serde(default)]
    pub is_syncing_supplies: bool,
}

impl Data {
    pub fn new(authorised_principals: Vec<Principal>, claimlink_canister_id: Principal) -> Self {
        Self {
            collections: CollectionModel::default(),
            authorised_principals,
            overall_stats: OverallStats::default(),
            claimlink_canister_id,
            is_syncing_collections: false,
            is_syncing_supplies: false,
            gold_collections_config: GoldCollectionsConfig::default(),
        }
    }
}
