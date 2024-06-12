use crate::{
    guards::caller_is_authorised_principal,
    utils::validate_set_daily_burn_amount_payload,
};

use canister_tracing_macros::trace;
use ic_cdk::query;

pub use canister_jobs_api::set_daily_burn_amount_validate::{
    Args as SetDailyBurnValidateArgs,
    Response as SetDailyBurnValidateResponse,
};

#[query(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
pub async fn set_daily_burn_amount_validate(
    amount: SetDailyBurnValidateArgs
) -> SetDailyBurnValidateResponse {
    match validate_set_daily_burn_amount_payload(&amount) {
        Ok(_) => {}
        Err(e) => {
            return Err(e);
        }
    }
    match serde_json::to_string_pretty(&amount) {
        Ok(json) => Ok(json),
        Err(e) => Err(format!("invalid payload : {e:?}")),
    }
}
