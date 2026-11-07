use gldt_swap_common::bridge::SignedEvmAdminAction;

/// The admin action id, which is also its `execute` nonce.
pub type Args = u64;
pub type Response = Option<SignedEvmAdminAction>;
