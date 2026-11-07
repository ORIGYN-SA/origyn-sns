use gldt_swap_common::bridge::{EvmChain, InboundTransfer};

/// Two Candid arguments: the chain and the transaction hash (`0x` and 64 hex digits, any case).
///
/// Lookup only: the burns the scraper has saved, in burn id order.
pub type Args = (EvmChain, String);
pub type Response = Vec<InboundTransfer>;
