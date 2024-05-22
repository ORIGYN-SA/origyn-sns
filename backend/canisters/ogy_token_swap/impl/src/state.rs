use candid::{ CandidType, Principal };
use canister_state_macros::canister_state;
use ic_ledger_types::{ AccountIdentifier, Subaccount };
use serde::{ Deserialize, Serialize };
use types::{ CanisterId, TimestampMillis };
use utils::{ env::{ CanisterEnv, Environment }, memory::MemorySize };

use crate::model::token_swap::TokenSwap;
use ogy_token_swap_api::requesting_principals::RequestingPrincipals;

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
            canister_ids: CanisterIds {
                ogy_legacy_ledger: self.data.canister_ids.ogy_legacy_ledger,
                ogy_new_ledger: self.data.canister_ids.ogy_new_ledger,
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
    pub canister_ids: CanisterIds,
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
    /// swap history of completed swaps
    pub canister_ids: CanisterIds,
    /// The minting account of legacy OGY where tokens are burned to
    pub minting_account: AccountIdentifier,
    /// List of requesting principals for deposit_accounts
    pub requesting_principals: RequestingPrincipals,
}

impl Data {
    pub fn new(
        ogy_new_ledger: CanisterId,
        ogy_legacy_ledger: CanisterId,
        ogy_legacy_minting_account_principal: Principal,
        authorized_principals: Vec<Principal>
    ) -> Self {
        Self {
            authorized_principals,
            token_swap: TokenSwap::default(),
            canister_ids: CanisterIds {
                ogy_new_ledger,
                ogy_legacy_ledger,
            },
            minting_account: AccountIdentifier::new(
                &ogy_legacy_minting_account_principal,
                &Subaccount([0; 32])
            ),
            requesting_principals: RequestingPrincipals::default(),
        }
    }
}

#[derive(Serialize, Deserialize, CandidType)]
pub struct CanisterIds {
    pub ogy_new_ledger: Principal,
    pub ogy_legacy_ledger: Principal,
}
