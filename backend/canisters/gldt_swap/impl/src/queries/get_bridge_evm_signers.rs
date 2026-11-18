use crate::bridge::evm::address::format_address;
use crate::state::read_state;
pub use gldt_swap_api_canister::get_bridge_evm_signers::Response as GetBridgeEvmSignersResponse;
use ic_cdk::query;

/// The EIP-55 addresses of the claims and admin keys, once loaded.
#[query]
pub fn get_bridge_evm_signers() -> GetBridgeEvmSignersResponse {
    read_state(|s| GetBridgeEvmSignersResponse {
        claims: s
            .data
            .bridge
            .claims_signer
            .as_ref()
            .map(|signer| format_address(&signer.address)),
        admin: s
            .data
            .bridge
            .admin_signer
            .as_ref()
            .map(|signer| format_address(&signer.address)),
    })
}
