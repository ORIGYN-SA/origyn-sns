use crate::guards::caller_is_authorized;
pub use gldt_swap_api_canister::manual_gldt_supply_balance::{
    Args as ManualGldtSupplyBalanceArgs, Response as ManualGldtSupplyBalanceResponse,
};
use ic_cdk::update;

/// Starts a supply balancer run now, unless a run holds the job guard.
#[update(hidden = true, guard = "caller_is_authorized")]
async fn manual_gldt_supply_balance(
    _: ManualGldtSupplyBalanceArgs,
) -> ManualGldtSupplyBalanceResponse {
    crate::jobs::manage_token_supply::spawn_gldt_supply_balancer();
}
