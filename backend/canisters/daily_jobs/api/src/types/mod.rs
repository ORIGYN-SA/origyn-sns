use candid::{ CandidType, Nat };
use serde::{ Deserialize, Serialize };

#[derive(Serialize, Deserialize, CandidType, Clone)]
pub struct BurnJobResult {
    pub timestamp: u64,
    pub block_height: Nat,
}
