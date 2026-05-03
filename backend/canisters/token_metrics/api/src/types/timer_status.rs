use candid::CandidType;
use serde::{Deserialize, Serialize};
use types::TimestampMillis;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct TimerStatus {
    pub name: String,
    pub interval_secs: u64,
    pub first_run_at: Option<TimestampMillis>,
    pub last_run_at: Option<TimestampMillis>,
    pub last_error: Option<String>,
    pub last_error_at: Option<TimestampMillis>,
    pub run_count: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum HealthStatus {
    Healthy,
    Error(String),
}
