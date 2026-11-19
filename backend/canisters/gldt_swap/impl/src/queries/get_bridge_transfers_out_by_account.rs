use crate::bridge::outbound::transfers_out_by_account;
pub use gldt_swap_api_canister::get_bridge_transfers_out_by_account::Response as GetBridgeTransfersOutByAccountResponse;
use ic_cdk::query;

/// The account's outbound transfers, newest first. `start` is an exclusive upper bound on the
/// id (the last id of the previous page); `limit` is capped at 100.
// the full path because `export_candid!` resolves argument types at the crate root
#[query]
pub fn get_bridge_transfers_out_by_account(
    account: icrc_ledger_types::icrc1::account::Account,
    start: Option<u64>,
    limit: u32,
) -> GetBridgeTransfersOutByAccountResponse {
    transfers_out_by_account(&account, start, limit)
}
