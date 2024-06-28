use serde::{ Deserialize, Serialize };
use candid::{ CandidType, Principal };
use canister_state_macros::canister_state;
use types::TimestampMillis;
use utils::{ env::{ CanisterEnv, Environment }, memory::MemorySize };

canister_state!(RuntimeState);

#[derive(Serialize, Deserialize)]
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
            ogy_dashboard_maintenance_mode: self.data.ogy_dashboard_maintenance_mode,
            authorized_principals: self.data.authorized_principals.clone(),
            governance_principals: self.data.governance_principals.clone(),
        }
    }

    pub fn is_caller_authorized(&self) -> bool {
        let caller = self.env.caller();
        self.data.authorized_principals.contains(&caller)
    }

    pub fn is_caller_governance_principal(&self) -> bool {
        let caller = self.env.caller();
        self.data.governance_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    pub ogy_dashboard_maintenance_mode: bool,
    pub authorized_principals: Vec<Principal>,
    pub governance_principals: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Data {
    /// Decides if the ogy Dashboard should be put into maintenance mode ( useful for when the backend and frontend need to update )
    pub ogy_dashboard_maintenance_mode: bool,
    pub authorized_principals: Vec<Principal>,
    pub governance_principals: Vec<Principal>,
}

impl Data {
    pub fn new(
        ogy_dashboard_maintenance_mode: bool,
        authorized_principals: Vec<Principal>,
        governance_principals: Vec<Principal>
    ) -> Self {
        Self {
            ogy_dashboard_maintenance_mode,
            authorized_principals,
            governance_principals,
        }
    }
}
