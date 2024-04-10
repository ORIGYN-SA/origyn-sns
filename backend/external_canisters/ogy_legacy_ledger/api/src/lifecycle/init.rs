// use std::time::Duration;

// use candid::{CandidType, Nat, Principal};
// use ic_ledger_types::{AccountIdentifier, Tokens};
// use icrc_ledger_types::icrc1::account::Account;
// use serde::Deserialize;

use crate::types::LedgerCanisterInitPayload;

pub type InitArgs = LedgerCanisterInitPayload;

// #[derive(CandidType, Deserialize)]
// pub struct InitArgs {
//     pub send_whitelist: Vec<Principal>,
//     pub token_symbol: Option<String>,
//     pub transfer_fee: Option<Tokens>,
//     pub minting_account: String,
//     pub transaction_window: Option<Duration>,
//     pub max_message_size_bytes: Option<u64>,
//     pub icrc1_minting_account: Option<Account>,
//     pub archive_options: Option<ArchiveOptions>,
//     pub initial_values: Vec<(String, Tokens)>,
//     pub token_name: Option<String>,
// }

// #[derive(CandidType)]
// pub struct InitArgs {
//     pub minting_account: AccountIdentifierDfx,
//     pub initial_values: Vec<(AccountIdentifierDfx, Tokens)>,
//     pub max_message_size_bytes: Option<usize>,
//     pub transaction_window: Option<Duration>,
//     pub archive_options: Option<ArchiveOptions>,
//     pub send_whitelist: Vec<Principal>,
//     pub standard_whitelist: Vec<Principal>,
//     pub transfer_fee: Option<Tokens>,
//     pub token_symbol: Option<String>,
//     // pub icrc1_minting_account: Option<Account>,
//     pub token_name: Option<String>,
//     pub admin: Principal,
// }

// type AccountIdentifierDfx = String;

// struct Test {
//     minting_account: String,
//     initial_values: Vec<(AccountIdentifier, Tokens)>,
//     max_message_size_bytes: Option<Nat>,
//     transaction_window: Option<Duration>,
//     archive_options: Option<Archive1>,
//     send_whitelist: Vec<Principal>,
//     transfer_fee: Option<Tokens>,
//     token_symbol: Option<String>,
//     icrc1_minting_account: Option<Account>,
//     token_name: Option<String>,
// }

// struct Archive1 {
//     trigger_threshold: Nat,
//     num_blocks_to_archive: Nat,
//     node_max_memory_size_bytes: Option<Nat>,
//     max_message_size_bytes: Option<Nat>,
//     controller_id: Principal,
//     cycles_for_archive_creation: Option<Nat>,
//     max_transactions_per_response: Option<Nat>,
// }

// #[derive(CandidType, Deserialize)]
// pub struct ArchiveOptions {
//     /// The number of blocks which, when exceeded, will trigger an archiving
//     /// operation.
//     pub trigger_threshold: usize,
//     /// The number of blocks to archive when trigger threshold is exceeded.
//     pub num_blocks_to_archive: usize,
//     pub node_max_memory_size_bytes: Option<u64>,
//     pub max_message_size_bytes: Option<u64>,
//     pub controller_id: Principal,
//     // More principals to add as controller of the archive.
//     // pub more_controller_ids: Option<Vec<Principal>>,
//     // cycles to use for the call to create a new archive canister.
//     pub cycles_for_archive_creation: Option<u64>,
//     // Max transactions returned by the [get_transactions] endpoint.
//     // pub max_transactions_per_response: Option<u64>,
// }

// #[derive(CandidType, Deserialize)]
// pub struct ArchiveOptions {
//     pub num_blocks_to_archive: u64,
//     pub max_transactions_per_response: Option<u64>,
//     pub trigger_threshold: u64,
//     pub max_message_size_bytes: Option<u64>,
//     pub cycles_for_archive_creation: Option<u64>,
//     pub node_max_memory_size_bytes: Option<u64>,
//     pub controller_id: Principal,
// }
