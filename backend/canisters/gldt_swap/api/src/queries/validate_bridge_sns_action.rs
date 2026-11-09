use gldt_swap_common::bridge::BridgeSnsAction;

/// An update, like `bridge_sns_action`, and only for SNS governance.
pub type Args = BridgeSnsAction;
/// `Ok` is the text voters read; `Err` says why the action would fail.
pub type Response = Result<String, String>;
