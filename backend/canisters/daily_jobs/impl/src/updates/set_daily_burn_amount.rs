use canister_tracing_macros::trace;
pub use daily_jobs_api::set_daily_burn_amount::{
    Args as SetDailyBurnAmountArgs,
    Response as SetDailyBurnAmountResponse,
};
use ic_cdk::update;
use crate::{ guards::caller_is_authorised_principal, state::mutate_state };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn set_daily_burn_amount(
    burn_amount: SetDailyBurnAmountArgs
) -> SetDailyBurnAmountResponse {
    mutate_state(|state| {
        state.data.daily_burn_amount = burn_amount;
    });
    Ok(burn_amount)
}
