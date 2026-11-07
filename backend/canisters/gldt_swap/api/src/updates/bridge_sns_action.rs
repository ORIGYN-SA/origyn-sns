use gldt_swap_common::bridge::BridgeSnsAction;

pub type Args = BridgeSnsAction;
/// Nothing: the call traps on any error, so the SNS proposal shows as failed.
pub type Response = ();
