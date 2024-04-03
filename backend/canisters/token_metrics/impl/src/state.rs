use candid::{CandidType, Principal};
use canister_state_macros::canister_state;
use serde::{Deserialize, Serialize};
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
    /// SNS governance cansiter
    pub sns_governance_canister: Principal,
    /// Information about governance neurons sync
    pub sync_info: SyncInfo,
}

impl Default for Data {
    fn default() -> Self {
        Self {
            sns_governance_canister: SNS_GOVERNANCE_CANISTER_ID,
            authorized_principals: vec![SNS_GOVERNANCE_CANISTER_ID],
            sync_info: SyncInfo::default(),
        }
    }
}
