//! Integration build only (`--features inttest`): endpoints and hooks the PocketIC tests use.
//! None of this is in the production wasm or in `can.did`.

mod insert_fake_bulk_swaps;
mod insert_fake_old_bulk_swaps;
mod lose_next_ledger_reply;

// `export_candid!` in lib.rs needs the argument and reply types in scope there.
pub use insert_fake_bulk_swaps::*;
pub use insert_fake_old_bulk_swaps::*;
pub use lose_next_ledger_reply::*;
