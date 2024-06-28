use crate::guards::caller_is_governance_principal;
use canister_tracing_macros::trace;
use ic_cdk::query;

pub use management_api_canister::call_icrc1_transfer_validate::{
    Args as CallTransferArgs,
    Response as CallTransferResponse,
};

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
pub async fn call_icrc1_transfer_validate(args: CallTransferArgs) -> CallTransferResponse {
    match serde_json::to_string_pretty(&args) {
        Ok(json) => Ok(json),
        Err(e) => Err(format!("invalid payload : {e:?}")),
    }
}
