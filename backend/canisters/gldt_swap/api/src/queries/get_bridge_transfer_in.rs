use gldt_swap_common::bridge::{EvmChain, InboundTransfer};

/// Two Candid arguments: the chain and the burn id on the chain's current token.
pub type Args = (EvmChain, u64);
pub type Response = Option<InboundTransfer>;
