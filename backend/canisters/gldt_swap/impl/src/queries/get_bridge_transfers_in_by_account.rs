use crate::bridge::inbound::transfers_in_by_account;
pub use gldt_swap_api_canister::get_bridge_transfers_in_by_account::Response as GetBridgeTransfersInByAccountResponse;
use ic_cdk::query;

/// The account's inbound transfers, newest first. `start` skips that many (the number already
/// shown); `limit` is capped at 100.
// the full path because `export_candid!` resolves argument types at the crate root
#[query]
pub fn get_bridge_transfers_in_by_account(
    account: icrc_ledger_types::icrc1::account::Account,
    start: Option<u64>,
    limit: u32,
) -> GetBridgeTransfersInByAccountResponse {
    transfers_in_by_account(&account, start, limit)
}
