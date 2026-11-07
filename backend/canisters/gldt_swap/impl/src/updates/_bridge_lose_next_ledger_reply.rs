use crate::bridge::test_hooks::lose_next_reply;
pub use crate::bridge::test_hooks::LedgerCall;
use crate::guards::caller_is_authorized;
use ic_cdk::update;

/// Integration build only: the canister's next mint or burn on the GLDT ledger runs, but the
/// canister drops its answer, as if the call had got no reply.
#[update(guard = "caller_is_authorized")]
fn _bridge_lose_next_ledger_reply(call: LedgerCall) {
    lose_next_reply(call);
}
