use gldt_swap_common::bridge::{BridgeError, BridgeToEvmArgs, OutboundTransfer};

pub type Args = BridgeToEvmArgs;
/// `Err` only when nothing was burned: a check failed or the ledger refused. Otherwise the
/// transfer as it stands; poll `get_bridge_transfer_out` until it is `Signed`.
pub type Response = Result<OutboundTransfer, BridgeError>;
