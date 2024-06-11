use candid::{ CandidType, Principal };
use canister_state_macros::canister_state;
use daily_jobs_api::BurnJobResult;
use serde::{ Deserialize, Serialize };
use types::{ CanisterId, TimestampMillis };
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
            jobs_info: self.data.jobs_info,
            daily_burn_amount: self.data.daily_burn_amount,
            ledger_canister_id: self.data.ledger_canister_id,
            burn_principal_id: self.data.burn_principal_id,
            authorized_principals: self.data.authorized_principals.clone(),
        }
    }
    pub fn is_caller_authorised_principal(&self) -> bool {
        let caller = self.env.caller();
        self.data.authorized_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    pub ledger_canister_id: Principal,
    pub jobs_info: JobsInfo,
    pub daily_burn_amount: u64,
    pub burn_principal_id: Principal,
    pub authorized_principals: Vec<Principal>,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: f64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Copy, Default)]
pub struct JobsInfo {
    pub last_ogy_burn_timestamp: TimestampMillis,
}
#[derive(Serialize, Deserialize)]
pub struct Data {
    /// authorized Principals for guarded calls
    pub authorized_principals: Vec<Principal>,
    /// SNS ledger canister
    pub ledger_canister_id: Principal,
    /// The burning target account
    pub burn_principal_id: Principal,
    /// The burning amount
    pub daily_burn_amount: u64,
    /// Jobs info
    pub jobs_info: JobsInfo,
    /// Vector to hold jobs results
    pub burn_jobs_results: Vec<BurnJobResult>,
}

impl Data {
    pub fn new(
        ledger_canister_id: CanisterId,
        burn_principal_id: Principal,
        daily_burn_amount: u64,
        authorized_principals: Vec<Principal>
    ) -> Self {
        Self {
            authorized_principals,
            ledger_canister_id,
            burn_principal_id,
            daily_burn_amount,
            jobs_info: JobsInfo::default(),
            burn_jobs_results: Vec::new(),
        }
    }
}
