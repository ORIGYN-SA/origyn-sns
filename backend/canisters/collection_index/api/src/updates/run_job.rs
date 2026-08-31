use candid::CandidType;
use serde::{Deserialize, Serialize};

pub type Args = Job;
pub type Response = Result<(), String>;

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq)]
pub enum Job {
    ComputeStats,
    SyncCollections,
    SyncSupplies,
}
