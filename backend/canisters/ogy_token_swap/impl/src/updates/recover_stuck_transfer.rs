use crate::{ guards::caller_is_authorised_principal, state::read_state, transfer_new_token };
use canister_tracing_macros::trace;
use ic_cdk::update;
use ic_ledger_types::BlockIndex;

use icrc_ledger_types::icrc1::transfer::BlockIndex as BlockIndexIcrc;
use ogy_token_swap_api::token_swap::{ RecoverTransferMode, SwapStatus };
pub use ogy_token_swap_api::updates::recover_stuck_transfer::{
    Args as RecoverStuckTransferArgs,
    Response as RecoverStuckTransferResponse,
};

#[update(guard = "caller_is_authorised_principal", hidden = true)]
#[trace]
pub async fn recover_stuck_transfer(
    args: RecoverStuckTransferArgs
) -> RecoverStuckTransferResponse {
    match recover_stuck_transfer_impl(args.block_index, args.recover_mode).await {
        Ok(block_index_icrc) => RecoverStuckTransferResponse::Success(block_index_icrc),
        Err(err) => err,
    }
}

pub(crate) async fn recover_stuck_transfer_impl(
    block_index: BlockIndex,
    recover_mode: RecoverTransferMode
) -> Result<BlockIndexIcrc, RecoverStuckTransferResponse> {
    let _transfer_request_args;
    if let Some(info) = read_state(|s| s.data.token_swap.get_swap_info(block_index)) {
        match info.status {
            SwapStatus::TransferRequest(data) => {
                _transfer_request_args = data;
            }
            status => {
                return Err(RecoverStuckTransferResponse::SwapIsNotStuckInTransfer(status));
            }
        }
    } else {
        return Err(RecoverStuckTransferResponse::NoSwapRequestFound);
    }
    // recover depending on the defined mode
    match recover_mode {
        RecoverTransferMode::RetryTransfer =>
            transfer_new_token(block_index).await.map_err(|err|
                RecoverStuckTransferResponse::FinalTransferFailed(err)
            ),
        RecoverTransferMode::TransferBlockProvided(transfer_block) => {
            // This case basically means that the transfer went through successful but for some reason wasn't updated
            // in the internal records. We can add a recovery for this in the future.
            Ok(transfer_block)
        }
    }
}
