use bity_ic_types::TimestampMillis;
use candid::CandidType;
use candid::Nat;
use candid::Principal;
use serde::{Deserialize, Serialize};
use utils::env::CanisterEnv;

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    pub env: CanisterEnv,
    pub data: DataV0,
}

#[derive(Serialize, Deserialize)]
pub struct DataV0 {
    /// authorized Principals for guarded calls
    pub authorized_principals: Vec<Principal>,
    /// SNS ledger canister
    pub ledger_canister_id: Principal,
    /// The burning target account
    pub burn_principal_id: Principal,
    /// The burning amount
    pub daily_burn_amount: u64,
    /// Jobs info
    pub jobs_info: JobsInfoV0,
    /// Vector to hold jobs results
    pub burn_jobs_results: Vec<BurnJobResultV0>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Copy, Default)]
pub struct JobsInfoV0 {
    pub last_ogy_burn_timestamp: TimestampMillis,
}

use crate::state::JobsInfo;
impl From<JobsInfoV0> for JobsInfo {
    fn from(value: JobsInfoV0) -> Self {
        Self {
            last_ogy_burn_timestamp: value.last_ogy_burn_timestamp,
        }
    }
}

#[derive(Serialize, Deserialize, CandidType, Clone)]
pub struct BurnJobResultV0 {
    pub timestamp: u64,
    pub block_height: Nat,
}

use canister_jobs_api::BurnJobResult;
impl From<&BurnJobResultV0> for BurnJobResult {
    fn from(value: &BurnJobResultV0) -> Self {
        Self {
            timestamp: value.timestamp,
            block_height: value.block_height.clone(),
        }
    }
}
