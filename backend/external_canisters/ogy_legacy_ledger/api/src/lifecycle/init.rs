use std::time::Duration;

use candid::{CandidType, Principal};
use ic_ledger_types::{AccountIdentifier, Tokens};

#[derive(CandidType)]
pub struct InitArgs {
    pub minting_account: Option<AccountIdentifier>,
    pub initial_values: Vec<(AccountIdentifier, Tokens)>,
    pub max_message_size_bytes: Option<usize>,
    pub transaction_window: Option<Duration>,
    pub archive_options: Option<ArchiveOptions>,
    pub send_whitelist: Vec<Principal>,
    pub standard_whitelist: Vec<Principal>,
    pub transfer_fee: Option<Tokens>,
    pub token_symbol: Option<String>,
    pub token_name: Option<String>,
    pub admin: Principal,
}

#[derive(CandidType)]
pub struct ArchiveOptions {
    /// The number of blocks which, when exceeded, will trigger an archiving
    /// operation.
    pub trigger_threshold: usize,
    /// The number of blocks to archive when trigger threshold is exceeded.
    pub num_blocks_to_archive: usize,
    pub node_max_memory_size_bytes: Option<u64>,
    pub max_message_size_bytes: Option<u64>,
    pub controller_id: Principal,
    // More principals to add as controller of the archive.
    pub more_controller_ids: Option<Vec<Principal>>,
    // cycles to use for the call to create a new archive canister.
    pub cycles_for_archive_creation: Option<u64>,
    // Max transactions returned by the [get_transactions] endpoint.
    pub max_transactions_per_response: Option<u64>,
}
