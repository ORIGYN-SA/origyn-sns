use crate::state::Data;
use serde::{Deserialize, Serialize};
use utils::env::CanisterEnvV0;

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    pub env: CanisterEnvV0,
    pub data: Data,
}
