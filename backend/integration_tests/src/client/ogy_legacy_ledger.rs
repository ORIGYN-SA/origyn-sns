use crate::{generate_query_call, generate_update_call};
use candid::Nat;

// Queries
// generate_query_call!(icrc1_balance_of);

// Updates
generate_update_call!(transfer);

// pub mod icrc1_balance_of {
//     use super::*;

//     pub type Args = Account;
//     pub type Response = Nat;
// }

pub mod transfer {
    use ogy_legacy_ledger_canister::{TransferArgs, TransferError};

    use super::*;

    type Type = TransferArgs;

    pub type Args = Type;
    pub type Response = Result<Nat, TransferError>;
}

pub mod happy_path {
    use super::*;
    use candid::Principal;
    use ic_ledger_types::{AccountIdentifier, BlockIndex};
    use ogy_legacy_ledger_canister::Tokens;
    use pocket_ic::PocketIc;
    use types::CanisterId;
    use utils::consts::E8S_FEE_OGY;

    pub fn transfer_ogy(
        env: &mut PocketIc,
        sender: Principal,
        ledger_canister_id: CanisterId,
        recipient: impl Into<AccountIdentifier>,
        amount: u64,
    ) -> BlockIndex {
        transfer(
            env,
            sender,
            ledger_canister_id,
            &transfer::Args {
                from_subaccount: None,
                to: recipient.into(),
                fee: Tokens { e8s: E8S_FEE_OGY },
                created_at_time: None,
                memo: 0,
                amount: Tokens { e8s: amount },
            },
        )
        .unwrap()
        .0
        .try_into()
        .unwrap()
    }

    // pub fn balance_of(
    //     env: &PocketIc,
    //     ledger_canister_id: CanisterId,
    //     account: impl Into<Account>,
    // ) -> u128 {
    //     icrc1_balance_of(
    //         env,
    //         Principal::anonymous(),
    //         ledger_canister_id,
    //         &account.into(),
    //     )
    //     .0
    //     .try_into()
    //     .unwrap()
    // }
}
