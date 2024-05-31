use std::time::Duration;

use candid::{ Nat, Principal };
use ic_ledger_types::{ AccountIdentifier, BlockIndex, Memo, Subaccount, Tokens };
use icrc_ledger_types::icrc1::{ account::Account, transfer::TransferError };
use ledger_utils::principal_to_legacy_account_id;
use ogy_token_swap_api::{
    get_swap_info::{ Args as GetSwapInfoArgs, Response as GetSwapInfoResponse },
    token_swap::{
        BurnRequestArgs,
        RecoverBurnMode,
        RecoverTransferMode,
        TransferFailReason,
        TransferRequestArgs,
    },
    types::token_swap::{ BlockFailReason, SwapError, SwapStatus },
    updates::{
        recover_stuck_burn::Response as RecoverStuckBurnResponse,
        recover_stuck_transfer::Response as RecoverStuckTransferResponse,
        swap_tokens::Response as SwapTokensResponse,
    },
};
use utils::consts::{ E8S_FEE_OGY, E8S_PER_OGY };
use pocket_ic::PocketIc;
use types::CanisterId;

use crate::{
    client::{
        icrc1::client::{ balance_of, total_supply as total_supply_new, transfer },
        ogy_legacy_ledger::client::{
            balance_of as balance_of_ogy_legacy,
            mint_ogy,
            total_supply as total_supply_legacy,
            transfer_ogy,
        },
        ogy_token_swap::{
            client::{
                deposit_account,
                manipulate_swap_status,
                recover_stuck_burn_call,
                recover_stuck_transfer_call,
                requesting_principals,
                swap_info,
                swap_tokens_anonymous_call,
                swap_tokens_authenticated_call,
            },
            get_swap_info,
        },
    },
    ogy_swap_suite::{ init::init, TestEnv },
    utils::{ random_amount, random_principal },
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
    let amount = 1 * E8S_PER_OGY;

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut pic,
        controller,
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
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let deposit_address = get_deposit_account_helper(
        &mut pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        amount - E8S_FEE_OGY
    ).unwrap();

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(result, SwapTokensResponse::Success(Nat::from(1u8)));

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), amount);

    // retry same swap should fail
    pic.advance_time(Duration::from_secs(60));
    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );
    assert_eq!(
        result,
        SwapTokensResponse::InternalError("Swap already completed on block 1.".to_string())
    );
    // balance shouldn't change
    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), amount);
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
        controller,
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
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let deposit_address = get_deposit_account_helper(
        &mut pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        amount - E8S_FEE_OGY
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

    match swap_info(&pic, controller, ogy_token_swap_canister_id, block_index_deposit) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) =>
            assert_eq!(
                info.status,
                SwapStatus::Failed(
                    SwapError::BlockFailed(
                        BlockFailReason::ReceiverNotCorrectAccountId(
                            Subaccount::from(user_false_request)
                        )
                    )
                )
            ),
        _ => panic!("Expect fail response."),
    }

    // Try the recover process by requesting with the correct user
    pic.advance_time(Duration::from_secs(60));

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(result, SwapTokensResponse::Success(Nat::from(1u8)));

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), amount);

    match swap_info(&pic, controller, ogy_token_swap_canister_id, block_index_deposit) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) => {
            assert_eq!(info.status, SwapStatus::Complete(Nat::from(1usize)))
        }
        _ => panic!("Expect success response."),
    }
}

#[test]
fn test_anonymous_request() {
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
        controller,
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
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let deposit_address = get_deposit_account_helper(
        &mut pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        amount - E8S_FEE_OGY
    ).unwrap();

    // requesting swap with anonymous principal simulating a call from e.g. the team on behalf of the user
    let result = swap_tokens_anonymous_call(
        &mut pic,
        ogy_token_swap_canister_id,
        user,
        block_index_deposit
    );

    assert_eq!(result, SwapTokensResponse::Success(Nat::from(1u8)));

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), Nat::from(amount));

    match swap_info(&pic, controller, ogy_token_swap_canister_id, block_index_deposit) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) => {
            assert_eq!(info.status, SwapStatus::Complete(Nat::from(1usize)))
        }
        _ => panic!("Expect success response."),
    }
}

#[test]
fn test_massive_users_swapping() {
    let mut env = init();

    let num_holders = 100;
    let holders = init_token_distribution(&mut env, num_holders);
    let old_ledger_total_supply = total_supply_legacy_wrapper(&mut env);

    // mint tokens to swap reserve pool of swap canister
    // test by adding the exact amount of tokens which corresponds to the total_supply of the old ledger
    let swap_pool_amount = old_ledger_total_supply.clone() + num_holders * E8S_FEE_OGY;
    init_swap_pool(&mut env, swap_pool_amount);

    for (index, holder) in holders.into_iter().enumerate() {
        user_token_swap_valid(&mut env, holder, Nat::from(index + 1));
    }

    // old ledger should be zero
    assert_eq!(total_supply_legacy_wrapper(&mut env), Nat::default());
    // new ledger should be previous total supply minus the
    assert_eq!(total_supply_new_wrapper(&mut env), old_ledger_total_supply)
}

#[test]
fn test_swap_amount_too_small() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    let user = random_principal();
    let amount = 1_000_000;

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut pic,
        controller,
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
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let deposit_address = get_deposit_account_helper(
        &mut pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        amount - E8S_FEE_OGY
    ).unwrap();

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(
        result,
        SwapTokensResponse::InternalError(
            format!(
                "Number of tokens in block is too small. Needs to be at least 100000000, found: 1000000."
            )
        )
    );

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), 0u64);
}

#[test]
fn test_recover_stuck_burn_on_completed_swap() {
    let mut env = init();

    let amount = Nat::from(1_000_000_000u64);

    let user = user_init(&mut env, amount.clone());

    init_swap_pool(&mut env, Nat::from(9_400_000_000 * E8S_PER_OGY));

    user_token_swap_valid(&mut env, user, Nat::from(1u8));

    // try to recover a successfully finished swap, should fail
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        1u64,
        RecoverBurnMode::RetryBurn,
        None
    );
    assert_eq!(
        RecoverStuckBurnResponse::SwapIsNotStuckInBurn(SwapStatus::Complete(Nat::from(1usize))),
        res
    );
}

#[test]
fn test_recover_stuck_burn_retry_burn() {
    let mut env = init();

    let amount = Nat::from(1_000_000_000u64);

    let user = user_init(&mut env, amount.clone());

    init_swap_pool(&mut env, Nat::from(9_400_000_000 * E8S_PER_OGY));

    user_token_swap_valid(&mut env, user, Nat::from(1u8));

    // now we can manipulate the state and check if the recovery works
    // in the first test, we completely reburn the tokens as we simulate that the request failed. So the BurnRequestArgs are irrelevant
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        1u64,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: None,
            amount: Tokens::from_e8s(0),
            memo: Memo(0),
        })
    );

    // Note that the tokens were already minted but we can burn those to correctly test
    let _ = transfer(
        &mut env.pic,
        user,
        env.canister_ids.ogy_new_ledger,
        None,
        env.controller,
        amount.clone()
    );
    assert_eq!(Nat::from(0u8), balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));

    // mint some tokens to the subaccount of the user again
    let tokens_to_mint: u64 = amount.clone().0.try_into().unwrap();
    let _ = mint_ogy(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_legacy_ledger,
        principal_to_legacy_account_id(env.canister_ids.ogy_swap, Some(Subaccount::from(user))),
        tokens_to_mint - E8S_FEE_OGY
    );

    // run the recovery
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        1u64,
        RecoverBurnMode::RetryBurn,
        None
    );
    assert_eq!(RecoverStuckBurnResponse::Success(Nat::from(3usize)), res);

    assert_eq!(amount, balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));
    match swap_info(&env.pic, user, env.canister_ids.ogy_swap, 1u64) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) => {
            assert_eq!(info.status, SwapStatus::Complete(Nat::from(3usize)))
        }
        _ => panic!("Expect success response."),
    }
}
#[test]
fn test_recover_stuck_burn_recheck_burn_block() {
    let mut env = init();

    let amount = Nat::from(1_000_000_000u64);

    let user = user_init(&mut env, amount.clone());
    let block_index = 1u64;

    init_swap_pool(&mut env, Nat::from(9_400_000_000 * E8S_PER_OGY));

    user_token_swap_valid(&mut env, user, Nat::from(block_index));

    // now we can manipulate the state and check if the recovery works
    // in the first test, we completely reburn the tokens as we simulate that the request failed. So the BurnRequestArgs are irrelevant
    let tokens_swapped: u64 = amount.clone().0.try_into().unwrap();
    let tokens_burned = tokens_swapped - E8S_FEE_OGY;
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: Some(Subaccount::from(user)),
            amount: Tokens::from_e8s(tokens_burned),
            memo: Memo(block_index),
        })
    );

    // Note that the tokens were already minted but we can burn those to correctly test
    let _ = transfer(
        &mut env.pic,
        user,
        env.canister_ids.ogy_new_ledger,
        None,
        env.controller,
        amount.clone()
    );
    assert_eq!(Nat::from(0u8), balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));

    // try recovery with not a valid burn block
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        RecoverBurnMode::BurnBlockProvided(1u64),
        None
    );
    assert_eq!(RecoverStuckBurnResponse::NotAValidBurnBlock("Not a burn block.".to_string()), res);

    // try recovery with not a valid swap request block
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index + 1,
        RecoverBurnMode::BurnBlockProvided(1u64),
        None
    );
    assert_eq!(RecoverStuckBurnResponse::NoSwapRequestFound, res);

    // try recovery with the wrong account defined
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: None,
            amount: Tokens::from_e8s(tokens_burned),
            memo: Memo(block_index),
        })
    );
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        RecoverBurnMode::BurnBlockProvided(2u64),
        None
    );
    assert_eq!(
        RecoverStuckBurnResponse::NotAValidBurnBlock(
            format!(
                "Sending account doesn't match. Expected: {}, found: {}.",
                principal_to_legacy_account_id(env.canister_ids.ogy_swap, None),
                principal_to_legacy_account_id(
                    env.canister_ids.ogy_swap,
                    Some(Subaccount::from(user))
                )
            )
        ),
        res
    );

    // try recovery with the wrong amount defined
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: Some(Subaccount::from(user)),
            amount: Tokens::from_e8s(0),
            memo: Memo(block_index),
        })
    );
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        RecoverBurnMode::BurnBlockProvided(2u64),
        None
    );
    assert_eq!(
        RecoverStuckBurnResponse::NotAValidBurnBlock(
            "Sending amount doesn't match. Expected: 0.00000000, found: 9.99800000.".to_string()
        ),
        res
    );

    // try recovery with the wrong memo defined
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: Some(Subaccount::from(user)),
            amount: Tokens::from_e8s(tokens_burned),
            memo: Memo(0),
        })
    );
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        RecoverBurnMode::BurnBlockProvided(2u64),
        None
    );
    assert_eq!(
        RecoverStuckBurnResponse::NotAValidBurnBlock(
            "Sending memo doesn't match. Expected: Memo(0), found: Memo(1).".to_string()
        ),
        res
    );

    // run the recovery in a valid way
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: Some(Subaccount::from(user)),
            amount: Tokens::from_e8s(tokens_burned),
            memo: Memo(block_index),
        })
    );
    let res = recover_stuck_burn_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        block_index,
        RecoverBurnMode::BurnBlockProvided(2u64),
        None
    );
    assert_eq!(RecoverStuckBurnResponse::Success(Nat::from(3usize)), res);

    assert_eq!(amount, balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));
    match swap_info(&env.pic, user, env.canister_ids.ogy_swap, block_index) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) => {
            assert_eq!(info.status, SwapStatus::Complete(Nat::from(3usize)))
        }
        _ => panic!("Expect success response."),
    }
}

#[test]
fn test_recover_stuck_transfer_retry_transfer() {
    let mut env = init();

    let amount = Nat::from(1_000_000_000u64);

    let user = user_init(&mut env, amount.clone());

    init_swap_pool(&mut env, Nat::from(9_400_000_000 * E8S_PER_OGY));

    user_token_swap_valid(&mut env, user, Nat::from(1u8));

    // now we can manipulate the state and check if the recovery works
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        1u64,
        SwapStatus::TransferRequest(TransferRequestArgs {
            created_at_time: None,
            to: Account {
                owner: user,
                subaccount: None,
            },
            amount: amount.clone(),
            memo: None,
        })
    );

    // Note that the tokens were already swapped but we can burn those to correctly test
    let _ = transfer(
        &mut env.pic,
        user,
        env.canister_ids.ogy_new_ledger,
        None,
        env.controller,
        amount.clone()
    );
    assert_eq!(Nat::from(0u8), balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));

    // run the recovery
    let res = recover_stuck_transfer_call(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        1u64,
        RecoverTransferMode::RetryTransfer
    );
    assert_eq!(RecoverStuckTransferResponse::Success(Nat::from(3usize)), res);

    assert_eq!(amount, balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));
    match swap_info(&env.pic, user, env.canister_ids.ogy_swap, 1u64) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) => {
            assert_eq!(info.status, SwapStatus::Complete(Nat::from(3usize)))
        }
        _ => panic!("Expect success response."),
    }
}

#[test]
fn test_insufficient_funds_in_distribution_pool() {
    let mut env = init();

    let amount = Nat::from(10_000_000_000u64);

    let user = user_init(&mut env, amount.clone());
    let block_index = 1u64;

    let init_pool_balance = Nat::from(10 * E8S_PER_OGY);
    init_swap_pool(&mut env, init_pool_balance.clone());

    user_token_swap_with_expected_response(
        &mut env,
        user,
        SwapTokensResponse::InternalError(
            format!(
                "Final token transfer failed due to transfer error. Message: the debit account doesn't have enough funds to complete the transaction, current balance: {}",
                init_pool_balance.clone()
            )
        )
    );

    assert_eq!(
        SwapStatus::Failed(
            SwapError::TransferFailed(
                TransferFailReason::TransferError(TransferError::InsufficientFunds {
                    balance: init_pool_balance,
                })
            )
        ),
        get_status(&mut env, block_index)
    );

    init_swap_pool(&mut env, Nat::from(100_000_000_000 * E8S_PER_OGY));

    env.pic.advance_time(Duration::from_secs(60));

    // retry again in normal mode
    assert_eq!(
        swap_tokens_authenticated_call(&mut env.pic, user, env.canister_ids.ogy_swap, block_index),
        SwapTokensResponse::Success(Nat::from(2usize))
    );
}

#[test]
fn test_deposit_account() {
    let env = init();
    let TestEnv { mut pic, canister_ids, .. } = env;

    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let user = random_principal();

    assert_eq!(
        get_deposit_account_helper(&mut pic, ogy_token_swap_canister_id, user).unwrap(),
        principal_to_legacy_account_id(ogy_token_swap_canister_id, Some(Subaccount::from(user)))
    )
}

#[test]
fn test_requesting_principals() {
    let mut env = init();

    let num_holders = 100;
    let mut holders = init_token_distribution(&mut env, num_holders);

    let mut subaccount_list = vec![];
    for holder in holders.clone() {
        subaccount_list.push(
            get_deposit_account_helper(&mut env.pic, env.canister_ids.ogy_swap, holder).unwrap()
        );
    }

    assert_eq!(
        holders
            .clone()
            .into_iter()
            .map(|p| {
                principal_to_legacy_account_id(env.canister_ids.ogy_swap, Some(Subaccount::from(p)))
            })
            .collect::<Vec<_>>(),
        subaccount_list
    );

    let mut requested_principals = requesting_principals(
        &env.pic,
        Principal::anonymous(),
        env.canister_ids.ogy_swap
    )
        .into_iter()
        .collect::<Vec<_>>();

    assert_eq!(holders.sort(), requested_principals.sort());

    assert_eq!(
        subaccount_list.sort(),
        requested_principals
            .clone()
            .into_iter()
            .map(|p| {
                principal_to_legacy_account_id(env.canister_ids.ogy_swap, Some(Subaccount::from(p)))
            })
            .collect::<Vec<_>>()
            .sort()
    );

    assert_eq!(subaccount_list.len(), requested_principals.len())
}

fn init_token_distribution(env: &mut TestEnv, num_users: u64) -> Vec<Principal> {
    let TestEnv { ref mut pic, ref canister_ids, controller } = env;

    let mut holders: Vec<Principal> = vec![];
    for _ in 0..num_users {
        let user = random_principal();
        let amount = random_amount(1, 1_000_000) * E8S_PER_OGY;
        let _ = mint_ogy(
            pic,
            *controller,
            canister_ids.ogy_legacy_ledger,
            principal_to_legacy_account_id(user, None),
            amount
        ).unwrap();
        holders.push(user);
    }
    holders
}

fn user_init(env: &mut TestEnv, amount: Nat) -> Principal {
    let user = random_principal();

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_legacy_ledger,
        principal_to_legacy_account_id(user, None),
        amount.0.try_into().unwrap()
    ).unwrap();

    user
}

fn init_swap_pool(env: &mut TestEnv, swap_pool_amount: Nat) {
    let TestEnv { ref mut pic, ref canister_ids, controller } = env;

    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    let _ = transfer(
        pic,
        ogy_new_ledger_minting_account.clone(),
        ogy_new_ledger_canister,
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );
}

fn user_token_swap_with_expected_response(
    env: &mut TestEnv,
    user: Principal,
    response: SwapTokensResponse
) -> u64 {
    let TestEnv { ref mut pic, ref canister_ids, .. } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let balance = balance_of_ogy_legacy(
        pic,
        ogy_legacy_ledger_canister,
        principal_to_legacy_account_id(user, None).to_string()
    ).e8s();
    let swap_amount = balance;

    let deposit_address = get_deposit_account_helper(
        pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        swap_amount - E8S_FEE_OGY
    ).unwrap();

    assert_eq!(
        swap_tokens_authenticated_call(pic, user, ogy_token_swap_canister_id, block_index_deposit),
        response
    );

    return swap_amount;
}

fn user_token_swap_valid(env: &mut TestEnv, user: Principal, swap_index: Nat) {
    let swap_amount = user_token_swap_with_expected_response(
        env,
        user,
        SwapTokensResponse::Success(swap_index)
    );

    assert_eq!(balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user), swap_amount);
}

fn get_deposit_account_helper(
    pic: &mut PocketIc,
    ogy_legacy_ledger_canister: CanisterId,
    user: Principal
) -> Result<AccountIdentifier, String> {
    match deposit_account(pic, ogy_legacy_ledger_canister, user) {
        ogy_token_swap_api::request_deposit_account::Response::Success(account_id) => {
            Ok(account_id)
        }
        ogy_token_swap_api::request_deposit_account::Response::MaxCapacityOfListReached =>
            Err("Max limit reached.".to_string()),
        ogy_token_swap_api::request_deposit_account::Response::MaxCapacityOfSwapsReached =>
            Err("Max swaps limit reached".to_string()),
    }
}

fn total_supply_legacy_wrapper(env: &mut TestEnv) -> Nat {
    total_supply_legacy(&mut env.pic, env.canister_ids.ogy_legacy_ledger)
}
fn total_supply_new_wrapper(env: &mut TestEnv) -> Nat {
    total_supply_new(&mut env.pic, env.canister_ids.ogy_new_ledger)
}

fn get_status(env: &mut TestEnv, block_index: BlockIndex) -> SwapStatus {
    match swap_info(&env.pic, env.controller, env.canister_ids.ogy_swap, block_index) {
        ogy_token_swap_api::get_swap_info::Response::Success(info) => info.status,
        _ => panic!("Expect success response."),
    }
}

#[test]
fn test_retry_transfer_when_new_ledger_inactive() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    let user = random_principal();
    let amount = 1 * E8S_PER_OGY;

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut pic,
        controller,
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
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let deposit_address = get_deposit_account_helper(
        &mut pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        amount - E8S_FEE_OGY
    ).unwrap();
    pic.stop_canister(ogy_new_ledger_canister, Some(controller)).unwrap(); // stop the new ledger - this should make the third step ( transfer fail )
    swap_tokens_authenticated_call(&mut pic, user, ogy_token_swap_canister_id, block_index_deposit);

    let res = get_swap_info(
        &pic,
        Principal::anonymous(),
        ogy_token_swap_canister_id,
        &(ogy_token_swap_api::get_swap_info::Args { block_index: block_index_deposit })
    );
    let swap_status = if let get_swap_info::Response::Success(inner) = res {
        Some(inner.status)
    } else {
        None
    };

    assert!(matches!(swap_status.unwrap(), SwapStatus::Failed(_)));

    // retry the same block index with the new ledger online
    pic.start_canister(ogy_new_ledger_canister, Some(controller)).unwrap();
    pic.advance_time(Duration::from_secs(60));
    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );
    assert_eq!(result, SwapTokensResponse::Success(Nat::from(1u8)));
}

#[test]
#[should_panic(expected = "FATAL ERROR: Caller is not an authorised principal")]
fn test_recover_stuck_burn_can_only_be_called_by_authorised_principals() {
    let mut env = init();

    let amount = Nat::from(1_000_000_000u64);

    let user = user_init(&mut env, amount.clone());

    init_swap_pool(&mut env, Nat::from(9_400_000_000 * E8S_PER_OGY));

    user_token_swap_valid(&mut env, user, Nat::from(1u8));

    // now we can manipulate the state and check if the recovery works
    // in the first test, we completely reburn the tokens as we simulate that the request failed. So the BurnRequestArgs are irrelevant
    manipulate_swap_status(
        &mut env.pic,
        Principal::anonymous(),
        env.canister_ids.ogy_swap,
        1u64,
        SwapStatus::BurnRequest(BurnRequestArgs {
            created_at_time: None,
            from_subaccount: None,
            amount: Tokens::from_e8s(0),
            memo: Memo(0),
        })
    );
}

#[test]
#[should_panic(expected = "FATAL ERROR: Caller is not an authorised principal")]
fn test_recover_stuck_transfer_can_only_be_called_by_authorised_principals() {
    let mut env = init();

    let amount = Nat::from(1_000_000_000u64);

    let user = user_init(&mut env, amount.clone());

    init_swap_pool(&mut env, Nat::from(9_400_000_000 * E8S_PER_OGY));

    user_token_swap_valid(&mut env, user, Nat::from(1u8));

    // now we can manipulate the state and check if the recovery works
    manipulate_swap_status(
        &mut env.pic,
        env.controller,
        env.canister_ids.ogy_swap,
        1u64,
        SwapStatus::TransferRequest(TransferRequestArgs {
            created_at_time: None,
            to: Account {
                owner: user,
                subaccount: None,
            },
            amount: amount.clone(),
            memo: None,
        })
    );

    // Note that the tokens were already swapped but we can burn those to correctly test
    let _ = transfer(
        &mut env.pic,
        user,
        env.canister_ids.ogy_new_ledger,
        None,
        env.controller,
        amount.clone()
    );
    assert_eq!(Nat::from(0u8), balance_of(&env.pic, env.canister_ids.ogy_new_ledger, user));

    // run the recovery - should fail because the caller is not authorised
    recover_stuck_transfer_call(
        &mut env.pic,
        Principal::anonymous(),
        env.canister_ids.ogy_swap,
        1u64,
        RecoverTransferMode::RetryTransfer
    );
}

#[test]
fn valid_swap_can_be_archived() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    let user = random_principal();
    let amount = 1 * E8S_PER_OGY;

    // mint tokens to swapping user
    let _ = mint_ogy(
        &mut pic,
        controller,
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
        None,
        ogy_token_swap_canister_id,
        swap_pool_amount.into()
    );

    let deposit_address = get_deposit_account_helper(
        &mut pic,
        ogy_token_swap_canister_id,
        user
    ).unwrap();

    let block_index_deposit = transfer_ogy(
        &mut pic,
        user,
        ogy_legacy_ledger_canister,
        deposit_address,
        amount - E8S_FEE_OGY
    ).unwrap();

    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );

    assert_eq!(result, SwapTokensResponse::Success(Nat::from(1u8)));

    let swap_info_result = get_swap_info(
        &pic,
        Principal::anonymous(),
        ogy_token_swap_canister_id,
        &(GetSwapInfoArgs {
            block_index: block_index_deposit,
        })
    );

    if let GetSwapInfoResponse::Success(swap_info) = swap_info_result {
        assert_eq!(swap_info.is_archived, true)
    }
}
