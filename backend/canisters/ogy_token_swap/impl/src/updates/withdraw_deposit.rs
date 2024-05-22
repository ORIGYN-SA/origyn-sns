use candid::Principal;
use ic_cdk::update;
use ic_ledger_types::{
    account_balance,
    transfer,
    AccountBalanceArgs,
    BlockIndex,
    Memo,
    Subaccount,
    Tokens,
    TransferArgs,
};
use ledger_utils::principal_to_legacy_account_id;
pub use ogy_token_swap_api::updates::withdraw_deposit::{
    Args as WithdrawDepositArgs,
    Response as WithdrawDepositResponse,
};
use utils::{ consts::E8S_FEE_OGY, env::Environment };
use crate::state::read_state;

#[update]
async fn withdraw_deposit() -> WithdrawDepositResponse {
    let caller = read_state(|s| s.env.caller());
    match withdraw_deposit_impl(caller).await {
        Ok(block_index_withdraw) => WithdrawDepositResponse::Success(block_index_withdraw),
        Err(error) => error,
    }
}

async fn withdraw_deposit_impl(caller: Principal) -> Result<BlockIndex, WithdrawDepositResponse> {
    let subaccount = Subaccount::from(caller);

    // Every user who deposits to a subaccount should have previously requested the subaccount.
    // To avoid spamming this method, we check if an entry exists before async calls are made to other canisters.
    if !validate_caller_has_deposit_account(&caller) {
        return Err(WithdrawDepositResponse::NoRecordOfSubaccountRequestFound);
    }

    let balance = fetch_balance(subaccount).await?;

    if balance <= E8S_FEE_OGY {
        return Err(WithdrawDepositResponse::InsufficientBalance(balance));
    }

    let amount_to_transfer = balance
        .checked_sub(E8S_FEE_OGY)
        .ok_or(
            WithdrawDepositResponse::InternalError(
                "Overflow error when subtracting E8S_FEE_OGY from balance".to_string()
            )
        )?;

    transfer_tokens(subaccount, caller, Tokens::from_e8s(amount_to_transfer)).await
}

fn validate_caller_has_deposit_account(caller: &Principal) -> bool {
    read_state(|s| s.data.requesting_principals.contains(caller))
}

async fn fetch_balance(of: Subaccount) -> Result<u64, WithdrawDepositResponse> {
    let ogy_legacy_ledger_canister_id = read_state(|s| s.data.canister_ids.ogy_legacy_ledger);

    let args = AccountBalanceArgs {
        account: principal_to_legacy_account_id(
            read_state(|s| s.env.canister_id()),
            Some(of)
        ),
    };

    match account_balance(ogy_legacy_ledger_canister_id, args).await {
        Ok(tokens) => Ok(tokens.e8s()),
        Err((_, msg)) => { Err(WithdrawDepositResponse::FailedToFetchBalance(msg)) }
    }
}

async fn transfer_tokens(
    from: Subaccount,
    to: Principal,
    amount: Tokens
) -> Result<BlockIndex, WithdrawDepositResponse> {
    let ogy_legacy_ledger_canister_id = read_state(|s| s.data.canister_ids.ogy_legacy_ledger);
    let args = TransferArgs {
        memo: Memo(0),
        to: principal_to_legacy_account_id(to, None),
        amount,
        fee: Tokens::from_e8s(E8S_FEE_OGY),
        from_subaccount: Some(from),
        created_at_time: None,
    };
    match transfer(ogy_legacy_ledger_canister_id, args).await {
        Ok(Ok(transfer_block_index)) => { Ok(transfer_block_index) }
        Ok(Err(msg)) => {
            Err(
                WithdrawDepositResponse::TransferError(
                    format!("Failed to withdraw deposit. Message: {msg}")
                )
            )
        }
        Err((_, msg)) => {
            Err(
                WithdrawDepositResponse::TransferCallError(
                    format!("Failed to withdraw deposit. Message: {msg}")
                )
            )
        }
    }
}
