use super::swap_nft_for_tokens::SwapNftForTokensErrors;
use candid::CandidType;
use gldt_swap_common::bridge::{BridgeError, EvmChain, OutboundTransfer};
use gldt_swap_common::general_error::GeneralError;
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap::SwapIndex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize, CandidType, PartialEq, Eq)]
pub struct SwapNftForEvmArgs {
    pub nfts: HashSet<Nft>,
    pub chain: EvmChain,
    /// The EVM address that receives the GLDT.
    pub recipient: String,
}

pub type Args = SwapNftForEvmArgs;
/// `Err` only when no NFT moved. Otherwise the swaps and the transfer as it stands; poll
/// `get_bridge_transfer_out` until it is `Signed`.
pub type Response = Result<SwapNftForEvmOk, SwapNftForEvmError>;

#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub struct SwapNftForEvmOk {
    pub swap_ids: Vec<SwapIndex>,
    pub transfer: OutboundTransfer,
}

#[derive(Debug, Clone, Serialize, Deserialize, CandidType)]
pub enum SwapNftForEvmError {
    Swap(SwapNftForTokensErrors),
    Bridge(BridgeError),
}

impl From<SwapNftForTokensErrors> for SwapNftForEvmError {
    fn from(err: SwapNftForTokensErrors) -> Self {
        SwapNftForEvmError::Swap(err)
    }
}

impl From<GeneralError> for SwapNftForEvmError {
    fn from(err: GeneralError) -> Self {
        SwapNftForEvmError::Swap(SwapNftForTokensErrors::GeneralError(err))
    }
}

impl From<BridgeError> for SwapNftForEvmError {
    fn from(err: BridgeError) -> Self {
        SwapNftForEvmError::Bridge(err)
    }
}
