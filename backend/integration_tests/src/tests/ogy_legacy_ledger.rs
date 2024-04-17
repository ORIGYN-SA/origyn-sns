use ic_ledger_types::Tokens;
use ledger_utils::principal_to_legacy_account_id;
use ogy_legacy_ledger_canister::TransferError;
use utils::consts::{ E8S_FEE_OGY, E8S_PER_OGY };

use crate::{
    client::ogy_legacy_ledger::happy_path::{ balance_of, mint_ogy, token_name, transfer_ogy },
    init::init,
    utils::random_principal,
    TestEnv,
};

#[test]
fn valid_transfer() {
    let env = init();
    let TestEnv { mut pic, canister_ids, .. } = env;

    let ledger_canister_id = canister_ids.ogy_legacy_ledger;

    let user1_principal = random_principal();
    let user1 = principal_to_legacy_account_id(user1_principal, None);
    let user2_principal = random_principal();
    let user2 = principal_to_legacy_account_id(user2_principal, None);

    let amount = 100 * E8S_PER_OGY;

    assert_eq!(token_name(&pic, ledger_canister_id).name, "Origyn");

    assert_eq!(mint_ogy(&mut pic, ledger_canister_id, user1, amount), Ok(0));

    assert_eq!(balance_of(&pic, ledger_canister_id, user1.to_string()), Tokens::from_e8s(amount));

    assert_eq!(
        transfer_ogy(&mut pic, user1_principal, ledger_canister_id, user2, amount),
        Err(TransferError::InsufficientFunds { balance: Tokens::from_e8s(amount) })
    );

    let amount = amount - E8S_FEE_OGY;

    assert_eq!(transfer_ogy(&mut pic, user1_principal, ledger_canister_id, user2, amount), Ok(1));

    assert_eq!(balance_of(&pic, ledger_canister_id, user1.to_string()), Tokens::from_e8s(0));
    assert_eq!(balance_of(&pic, ledger_canister_id, user2.to_string()), Tokens::from_e8s(amount));
}
