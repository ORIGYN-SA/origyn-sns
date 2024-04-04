use candid::{CandidType, Principal};
use canister_state_macros::canister_state;
use ic_ledger_types::{AccountIdentifier, Subaccount};
use serde::{Deserialize, Serialize};
use types::TimestampMillis;
use utils::{
    consts::{OGY_LEDGER_CANISTER_ID, OGY_LEGACY_LEDGER_CANISTER_ID, SNS_GOVERNANCE_CANISTER_ID},
    env::{CanisterEnv, Environment},
    memory::MemorySize,
};

use crate::model::token_swap::TokenSwap;

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
    /// authorized Principals for guarded calls
    pub authorized_principals: Vec<Principal>,
    /// state of the swaps
    pub token_swap: TokenSwap,
    /// canister ids that are being interacted with
    pub canister_ids: CanisterIds,
    /// The minting account of legacy OGY where tokens are burned to
    pub minting_account: AccountIdentifier,
}

impl Default for Data {
    fn default() -> Self {
        Self {
            authorized_principals: vec![SNS_GOVERNANCE_CANISTER_ID],
            token_swap: TokenSwap::default(),
            canister_ids: CanisterIds::default(),
            minting_account: AccountIdentifier::new(
                &SNS_GOVERNANCE_CANISTER_ID, // TODO - REPLACE THIS!!!
                &Subaccount([0; 32]),
            ),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct CanisterIds {
    pub ogy_new_ledger: Principal,
    pub ogy_legacy_ledger: Principal,
}

impl Default for CanisterIds {
    fn default() -> Self {
        Self {
            ogy_new_ledger: OGY_LEDGER_CANISTER_ID,
            ogy_legacy_ledger: OGY_LEGACY_LEDGER_CANISTER_ID,
        }
    }
}
