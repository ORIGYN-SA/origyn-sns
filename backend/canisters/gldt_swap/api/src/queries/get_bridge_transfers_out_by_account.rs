use gldt_swap_common::bridge::OutboundTransfer;
use icrc_ledger_types::icrc1::account::Account;

/// Three Candid arguments: the account, `start` and `limit`.
///
/// Newest first. `start` is an exclusive upper bound on the id: pass the last id of the
/// previous page, or `null` for the newest. `limit` is capped at 100.
pub type Args = (Account, Option<u64>, u32);
pub type Response = Vec<OutboundTransfer>;
