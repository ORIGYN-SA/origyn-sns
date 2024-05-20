use candid::Nat;
use icrc_ledger_types::icrc1::{ account::Account, transfer::TransferError };

use crate::client::icrc1::client::{ balance_of, transfer };
use crate::ogy_swap_suite::{ init::init, TestEnv };

use crate::utils::{ random_principal, E8S_FEE_OGY, E8S_PER_OGY };

#[test]
fn valid_transfer() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ledger_canister_id = canister_ids.ogy_new_ledger;
    let minting_account = controller;

    let user1 = Account { owner: random_principal(), subaccount: None };
    let user2 = Account { owner: random_principal(), subaccount: None };

    let amount = 100 * E8S_PER_OGY;

    assert_eq!(
        transfer(&mut pic, minting_account, ledger_canister_id, None, user1, amount.into()),
        Ok((0u8).into())
    );

    assert_eq!(balance_of(&pic, ledger_canister_id, user1), Nat::from(amount));

    assert_eq!(
        transfer(&mut pic, user1.owner, ledger_canister_id, None, user2, amount.into()),
        Err(TransferError::InsufficientFunds { balance: Nat::from(amount) })
    );

    let amount = amount - E8S_FEE_OGY;

    assert_eq!(
        transfer(&mut pic, user1.owner, ledger_canister_id, None, user2, amount.into()),
        Ok((1u8).into())
    );

    assert_eq!(balance_of(&pic, ledger_canister_id, user1), Nat::default());
    assert_eq!(balance_of(&pic, ledger_canister_id, user2), Nat::from(amount));
}
