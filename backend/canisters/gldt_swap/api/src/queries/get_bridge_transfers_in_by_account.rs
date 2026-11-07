use gldt_swap_common::bridge::InboundTransfer;
use icrc_ledger_types::icrc1::account::Account;

/// Three Candid arguments: the ICP account, `start` and `limit`.
///
/// Newest first, by discovery time. `start` skips that many transfers, the number already
/// shown (`null` for the newest); a burn found between two calls shifts the later pages by one.
/// `limit` is capped at 100.
pub type Args = (Account, Option<u64>, u32);
pub type Response = Vec<InboundTransfer>;
