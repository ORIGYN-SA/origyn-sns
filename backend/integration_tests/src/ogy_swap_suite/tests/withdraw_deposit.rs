use candid::{ Nat, Principal };
use ic_ledger_types::{ AccountIdentifier, Tokens };
use ledger_utils::principal_to_legacy_account_id;
use utils::consts::{ E8S_FEE_OGY, E8S_PER_OGY };
use pocket_ic::PocketIc;
use types::CanisterId;

use crate::{
    client::{
        ogy_legacy_ledger::client::{ balance_of, mint_ogy, transfer_ogy },
        ogy_token_swap::{ client::{ deposit_account, withdraw_deposit_call }, withdraw_deposit },
    },
    ogy_swap_suite::{ init::init, TestEnv },
    utils::random_principal,
};

#[test]
fn withdraw_deposit_user_does_not_have_record() {
    let mut env = init();

    let amount = 1 * E8S_PER_OGY;
    let user = user_init(&mut env, amount.into());

    assert_eq!(
        withdraw_deposit::Response::NoRecordOfSubaccountRequestFound,
        withdraw_deposit_call(&mut env.pic, user, env.canister_ids.ogy_swap)
    );
}

#[test]
fn withdraw_deposit_insufficient_balance() {
    let mut env = init();

    let amount = 2 * E8S_FEE_OGY;
    let user = user_init(&mut env, amount.into());

    transfer_deposit(&mut env, user, amount);

    assert_eq!(
        withdraw_deposit::Response::InsufficientBalance(E8S_FEE_OGY),
        withdraw_deposit_call(&mut env.pic, user, env.canister_ids.ogy_swap)
    );
}

#[test]
fn withdraw_deposit_happy_path() {
    let mut env = init();

    let amount = 1 * E8S_PER_OGY;
    let user = user_init(&mut env, amount.into());

    transfer_deposit(&mut env, user, amount);

    assert_eq!(
        withdraw_deposit::Response::Success(2),
        withdraw_deposit_call(&mut env.pic, user, env.canister_ids.ogy_swap)
    );

    assert_eq!(
        Tokens::from_e8s(amount - 2 * E8S_FEE_OGY),
        balance_of(
            &env.pic,
            env.canister_ids.ogy_legacy_ledger,
            principal_to_legacy_account_id(user, None).to_string()
        )
    )
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

fn get_deposit_account_helper(
    pic: &mut PocketIc,
    ogy_token_swap_canister: CanisterId,
    user: Principal
) -> Result<AccountIdentifier, String> {
    match deposit_account(pic, ogy_token_swap_canister, user) {
        ogy_token_swap_api::request_deposit_account::Response::Success(account_id) => {
            Ok(account_id)
        }
        ogy_token_swap_api::request_deposit_account::Response::MaxCapacityOfListReached =>
            Err("Max limit reached.".to_string()),
        ogy_token_swap_api::request_deposit_account::Response::MaxCapacityOfSwapsReached =>
            Err("Max swaps limit reached".to_string()),
    }
}

fn transfer_deposit(env: &mut TestEnv, user: Principal, amount: u64) {
    let deposit_account = get_deposit_account_helper(
        &mut env.pic,
        env.canister_ids.ogy_swap,
        user
    ).unwrap();

    let _ = transfer_ogy(
        &mut env.pic,
        user,
        env.canister_ids.ogy_legacy_ledger,
        deposit_account,
        amount - E8S_FEE_OGY
    ).unwrap();
}
