use candid::{ Nat, Principal };
use ic_ledger_types::{ Subaccount, Tokens };
use ledger_utils::principal_to_legacy_account_id;
use ogy_token_swap::{
    model::token_swap::{ BlockFailReason, SwapError, SwapInfo, SwapStatus },
    updates::swap_tokens::SwapTokensResponse,
};
use utils::consts::{ E8S_FEE_OGY, E8S_PER_OGY };

use crate::{
    client::{
        icrc1::happy_path::{ balance_of, transfer },
        ogy_legacy_ledger::happy_path::{ mint_ogy, transfer_ogy },
        ogy_token_swap::happy_path::{ deposit_account, swap_info, swap_tokens_authenticated_call },
    },
    init::init,
    utils::random_principal,
    TestEnv,
};

#[test]
fn valid_swap() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    let user = random_principal();
    let amount = 100_000 * E8S_PER_OGY;

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut pic,
        ogy_legacy_ledger_canister,
        principal_to_legacy_account_id(user, None),
        amount
    ).unwrap();
    // mint tokens to swap reserve pool of swap canister
    let swap_pool_amount = 9_400_000_000 * E8S_PER_OGY;
    let _ = transfer(
        &mut pic,
        ogy_new_ledger_minting_account,
        ogy_new_ledger_canister,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let swap_amount = amount - E8S_FEE_OGY;

    let deposit_address = deposit_account(&pic, ogy_token_swap_canister_id, user);

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        swap_amount
    ).unwrap();

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(result, SwapTokensResponse::Success);

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), swap_amount)
}

#[test]
fn invalid_deposit_account() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    // user who deposited the amount
    let user = random_principal();
    // user who intially requests the swap but then fails
    let user_false_request = random_principal();
    let amount = 100_000 * E8S_PER_OGY;

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut pic,
        ogy_legacy_ledger_canister,
        principal_to_legacy_account_id(user, None),
        amount
    ).unwrap();
    // mint tokens to swap reserve pool of swap canister
    let swap_pool_amount = 9_400_000_000 * E8S_PER_OGY;
    let _ = transfer(
        &mut pic,
        ogy_new_ledger_minting_account,
        ogy_new_ledger_canister,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let swap_amount = amount - E8S_FEE_OGY;

    let deposit_address = deposit_account(&pic, ogy_token_swap_canister_id, user);

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        swap_amount
    ).unwrap();

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user_false_request,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(
        result,
        SwapTokensResponse::InternalError(
            format!(
                "Receiving account for principal {} is not the correct account id. Expected {}, found {}",
                user_false_request,
                principal_to_legacy_account_id(
                    ogy_token_swap_canister_id,
                    Some(Subaccount::from(user_false_request))
                ),
                deposit_address
            )
        )
    );

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), Nat::default());

    assert_eq!(
        swap_info(
            &pic,
            controller,
            ogy_token_swap_canister_id,
            block_index_deposit
        ).unwrap().status,
        SwapStatus::Failed(
            SwapError::BlockFailed(
                BlockFailReason::ReceiverNotCorrectAccountId(Subaccount::from(user_false_request))
            )
        )
    );

    // Try the recover process by requesting with the correct user

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(result, SwapTokensResponse::Success);

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), swap_amount);

    assert_eq!(
        swap_info(
            &pic,
            controller,
            ogy_token_swap_canister_id,
            block_index_deposit
        ).unwrap().status,
        SwapStatus::Complete
    )
}

#[test]
fn test_deposit_account() {
    let env = init();
    let TestEnv { pic, canister_ids, .. } = env;

    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let user = random_principal();

    assert_eq!(
        deposit_account(&pic, ogy_token_swap_canister_id, user),
        principal_to_legacy_account_id(ogy_token_swap_canister_id, Some(Subaccount::from(user)))
    )
}
