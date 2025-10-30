use candid::Principal;
use ic_ledger_types::AccountIdentifier;
use ogy_token_swap_api::requesting_principals::RequestingPrincipals;
use serde::{ Deserialize, Serialize };
use utils::env::CanisterEnv;

use crate::{ model::token_swap::TokenSwap, state::CanisterIds };

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    /// Runtime environment
    pub env: CanisterEnv,
    /// Runtime data
    pub data: DataV0,
}

#[derive(Serialize, Deserialize)]
pub struct DataV0 {
    pub authorized_principals: Vec<Principal>,
    pub token_swap: TokenSwap,
    pub canister_ids: CanisterIds,
    pub minting_account: AccountIdentifier,
    pub requesting_principals: RequestingPrincipals,
}
