use crate::state::Data;

use crate::state::RuntimeState;

use self::types::state::RuntimeStateV0;

pub mod types;

impl From<RuntimeStateV0> for RuntimeState {
    fn from(old_state: RuntimeStateV0) -> Self {
        Self {
            env: old_state.env,
            data: Data {
                authorized_principals: old_state.data.authorized_principals,
                ledger_canister_id: old_state.data.ledger_canister_id,
                burn_principal_id: old_state.data.burn_principal_id,
                daily_burn_amount: old_state.data.daily_burn_amount,
                jobs_info: old_state.data.jobs_info.into(),
                burn_jobs_results: old_state.data.burn_jobs_results.iter().map(|v| v.into()).collect(),
            },
        }
    }
}
