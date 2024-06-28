use crate::guards::caller_is_governance_principal;
use canister_tracing_macros::trace;
use ic_cdk::query;

use icrc_ledger_types::icrc1::transfer::TransferArg;
pub use management_api_canister::call_icrc1_transfer::{
    Args as CallTransferArgs,
    Response as CallTransferResponse,
};
use types::CanisterId;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
pub async fn call_icrc1_transfer(args: CallTransferArgs) -> CallTransferResponse {
    call_icrc1_transfer_impl(&args.ledger_canister_id, &args.transfer_args).await;
}

async fn call_icrc1_transfer_impl(ledger_id: &CanisterId, args: &TransferArg) -> Result<(), ()> {
    Ok(())
}
