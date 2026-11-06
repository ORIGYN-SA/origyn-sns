use crate::guards::caller_is_authorized;
use crate::state::mutate_state;
use bity_ic_canister_tracing_macros::trace;
pub use gldt_swap_api_canister::bridge_pause::Args as BridgePauseArgs;
use gldt_swap_common::bridge::Severity;
use ic_cdk::update;
use utils::env::Environment;

/// Authorized principals can pause either direction but never unpause;
/// unpausing is an SNS `SetIcpPaused` action.
#[update(guard = "caller_is_authorized")]
#[trace]
pub fn bridge_pause(args: BridgePauseArgs) {
    mutate_state(|s| {
        let caller = s.env.caller();
        let now = s.env.now_nanos();
        let bridge = &mut s.data.bridge;
        let mut paused = Vec::new();
        if args.inbound && !bridge.paused_in {
            bridge.paused_in = true;
            paused.push("inbound");
        }
        if args.outbound && !bridge.paused_out {
            bridge.paused_out = true;
            paused.push("outbound");
        }
        if !paused.is_empty() {
            bridge.push_alert(
                now,
                Severity::Warning,
                format!("bridge {} paused by {caller}", paused.join(" and ")),
            );
        }
    });
}
