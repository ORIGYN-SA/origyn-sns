use crate::{
    guards::caller_is_governance_principal,
    utils::validate_set_daily_ogy_burn_rate_payload,
};
use canister_tracing_macros::trace;
use ic_cdk::query;

pub use sns_rewards_api_canister::set_daily_ogy_burn_rate_validate::{
    Args as SetDailyOGYBurnRateValidateArgs,
    Response as SetDailyOGYBurnRateValidateResponse,
};

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
pub async fn set_daily_ogy_burn_rate_validate(
    amount: SetDailyOGYBurnRateValidateArgs
) -> SetDailyOGYBurnRateValidateResponse {
    match validate_set_daily_ogy_burn_rate_payload(&amount) {
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
