use candid::{ Nat, Principal };
use ic_ledger_types::Subaccount;
use ledger_utils::principal_to_legacy_account_id;
use ogy_token_swap::{
    model::token_swap::{ BlockFailReason, SwapError, SwapStatus },
    updates::swap_tokens::SwapTokensResponse,
};
use pocket_ic::PocketIc;
use types::CanisterId;
use utils::consts::{ E8S_FEE_OGY, E8S_PER_OGY };

use crate::{
    client::{
        icrc1::client::{ balance_of, total_supply as total_supply_new, transfer },
        ogy_legacy_ledger::client::{
            balance_of as balance_of_ogy_legacy,
            mint_ogy,
            total_supply as total_supply_legacy,
            transfer_ogy,
        },
        ogy_token_swap::client::{
            deposit_account,
            swap_info,
            swap_tokens_anonymous_call,
            swap_tokens_authenticated_call,
        },
    },
    ogy_swap_suite::init::init,
    utils::{ random_amount, random_principal },
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

    let deposit_address = deposit_account(&pic, ogy_token_swap_canister_id, user);

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

    assert_eq!(result, SwapTokensResponse::Success);

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), amount);

    // retry same swap should fail
    let result = swap_tokens_authenticated_call(
        &mut pic,
        user,
        ogy_token_swap_canister_id,
        block_index_deposit
    );
    assert_eq!(result, SwapTokensResponse::InternalError("Swap already completed.".to_string()));
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

    let deposit_address = deposit_account(&pic, ogy_token_swap_canister_id, user);

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

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), amount);

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

    let deposit_address = deposit_account(&pic, ogy_token_swap_canister_id, user);

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

    assert_eq!(result, SwapTokensResponse::Success);

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), Nat::from(amount));

    assert_eq!(
        swap_info(
            &pic,
            controller,
            ogy_token_swap_canister_id,
            block_index_deposit
        ).unwrap().status,
        SwapStatus::Complete
    );
}

#[test]
fn test_massive_users_swapping() {
    let mut env = init();
    let TestEnv { ref mut pic, canister_ids, controller } = env;

    let ogy_legacy_ledger_canister = canister_ids.ogy_legacy_ledger;
    let ogy_new_ledger_canister = canister_ids.ogy_new_ledger;
    let ogy_token_swap_canister_id = canister_ids.ogy_swap;

    let ogy_new_ledger_minting_account = controller;

    let num_holders = 100;
    let holders = init_token_distribution(pic, ogy_legacy_ledger_canister, controller, num_holders);
    let old_ledger_total_supply = total_supply_legacy(pic, ogy_legacy_ledger_canister);

    // mint tokens to swap reserve pool of swap canister
    // test by adding the exact amount of tokens which corresponds to the total_supply of the old ledger
    let _ = transfer(
        pic,
        ogy_new_ledger_minting_account,
        ogy_new_ledger_canister,
        None,
        ogy_token_swap_canister_id,
        old_ledger_total_supply.clone() + num_holders * E8S_FEE_OGY // fees need to be added as ORIGYN covers those
    );

    for holder in holders {
        user_token_swap(
            pic,
            holder,
            ogy_legacy_ledger_canister,
            ogy_new_ledger_canister,
            ogy_token_swap_canister_id
        );
    }

    // old ledger should be zero
    assert_eq!(total_supply_legacy(pic, ogy_legacy_ledger_canister), Nat::default());
    // new ledger should be previous total supply minus the
    assert_eq!(total_supply_new(pic, ogy_new_ledger_canister), old_ledger_total_supply)
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

    let deposit_address = deposit_account(&pic, ogy_token_swap_canister_id, user);

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
                "Number of tokens in block is too small. Needs to be at least 1.00000000, found: 0.01000000."
            )
        )
    );

    assert_eq!(balance_of(&pic, ogy_new_ledger_canister, user), 0u64);
}

#[test]
fn test_insufficient_funds_in_distribution_pool() {}

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

fn init_token_distribution(
    pic: &mut PocketIc,
    ledger_canister_id: CanisterId,
    minting_account: Principal,
    num_users: u64
) -> Vec<Principal> {
    let mut holders: Vec<Principal> = vec![];
    for _ in 0..num_users {
        let user = random_principal();
        let amount = random_amount(1, 1_000_000) * E8S_PER_OGY;
        let _ = mint_ogy(
            pic,
            minting_account,
            ledger_canister_id,
            principal_to_legacy_account_id(user, None),
            amount
        ).unwrap();
        holders.push(user);
    }
    holders
}

fn user_token_swap(
    pic: &mut PocketIc,
    user: Principal,
    old_ledger_canister_id: CanisterId,
    new_ledger_canister_id: CanisterId,
    swap_canister_id: CanisterId
) {
    let balance = balance_of_ogy_legacy(
        pic,
        old_ledger_canister_id,
        principal_to_legacy_account_id(user, None).to_string()
    ).e8s();
    let swap_amount = balance;

    let deposit_address = deposit_account(&pic, swap_canister_id, user);

    let block_index_deposit = transfer_ogy(
        pic,
        user,
        old_ledger_canister_id,
        deposit_address,
        swap_amount - E8S_FEE_OGY
    ).unwrap();

    assert_eq!(
        swap_tokens_authenticated_call(pic, user, swap_canister_id, block_index_deposit),
        SwapTokensResponse::Success
    );

    assert_eq!(balance_of(&pic, new_ledger_canister_id, user), swap_amount);
}
