use gldt_swap_common::bridge::SignedEvmAdminAction;

/// Two Candid arguments: `start` and `limit`.
///
/// Newest first. `start` is an exclusive upper bound on the id: pass the last id of the
/// previous page, or `null` for the newest. `limit` is capped at 100.
pub type Args = (Option<u64>, u32);
pub type Response = Vec<SignedEvmAdminAction>;
