use std::collections::HashSet;

use crate::state::{Data, RuntimeState};

use self::types::state::RuntimeStateV0;

pub mod types;

impl From<RuntimeStateV0> for RuntimeState {
    fn from(old_state: RuntimeStateV0) -> Self {
        // construct new state
        Self {
            env: old_state.env,
            data: Data {
                authorized_principals: old_state.data.authorized_principals,
                token_swap: old_state.data.token_swap,
                canister_ids: old_state.data.canister_ids,
                minting_account: old_state.data.minting_account,
                requesting_principals: old_state.data.requesting_principals,
                whitelisted_principals: HashSet::new(),
            },
        }
    }
}
