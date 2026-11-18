//! PocketIC tests of the GLDT bridge in gldt_swap. They need `wasms/evm_rpc.wasm.gz` (the EVM
//! RPC canister, release evm_rpc-v2.8.0) and an integration build of gldt_swap.

mod e2e_anvil;
mod fixtures;
mod inbound;
mod nft_to_evm;
mod outbound;
pub mod outcalls;
pub mod setup;
mod sns_actions;
mod upgrade;
