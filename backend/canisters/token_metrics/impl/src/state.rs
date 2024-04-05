use candid::{CandidType, Principal};
use canister_state_macros::canister_state;
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::NeuronId;
use std::collections::BTreeMap;
use types::TimestampMillis;
use utils::{
    consts::SNS_GOVERNANCE_CANISTER_ID,
    env::{CanisterEnv, Environment},
    memory::MemorySize,
};

canister_state!(RuntimeState);

#[derive(Default, Serialize, Deserialize)]
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
            sync_info: self.data.sync_info,
            number_of_owners: self.data.principal_neurons.len(),
            sns_governance_canister: self.data.sns_governance_canister,
        }
    }

    pub fn is_caller_governance_principal(&self) -> bool {
        let caller = self.env.caller();
        self.data.authorized_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    pub sns_governance_canister: Principal,
    pub number_of_owners: usize,
    pub sync_info: SyncInfo,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: f64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Copy, Default)]
pub struct SyncInfo {
    pub last_synced_start: TimestampMillis,
    pub last_synced_end: TimestampMillis,
    pub last_synced_number_of_neurons: usize,
}

#[derive(Serialize, Deserialize)]
pub struct Data {
    /// authorized Principals for guarded calls
    pub authorized_principals: Vec<Principal>,
    /// All stats about governance, total staked, unlocked, locked and rewards
    pub all_gov_stats: GovernanceStats,
    /// SNS governance cansiter
    pub sns_governance_canister: Principal,
    /// Information about governance neurons sync
    pub sync_info: SyncInfo,
    /// Stores the mapping of each principal to its neurons
    pub principal_neurons: BTreeMap<Principal, Vec<NeuronId>>,
    /// Stores governance stats by principal
    pub principal_gov_stats: BTreeMap<Principal, GovernanceStats>,
}

#[derive(Serialize, Deserialize, Clone, Copy, Default, CandidType)]
pub struct GovernanceStats {
    pub total_staked: u64,
    pub total_locked: u64,
    pub total_unlocked: u64,
    pub total_rewards: u64,
}

impl Default for Data {
    fn default() -> Self {
        Self {
            sns_governance_canister: SNS_GOVERNANCE_CANISTER_ID,
            authorized_principals: vec![SNS_GOVERNANCE_CANISTER_ID],
            principal_neurons: BTreeMap::new(),
            principal_gov_stats: BTreeMap::new(),
            all_gov_stats: GovernanceStats::default(),
            sync_info: SyncInfo::default(),
        }
    }
}
