use crate::{generate_pocket_query_call, generate_pocket_update_call};
use candid::Nat;
use icrc_ledger_canister::icrc1_balance_of;
use icrc_ledger_canister::icrc1_minting_account;
use icrc_ledger_canister::icrc1_total_supply;
use icrc_ledger_canister::icrc1_transfer;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::TransferArg;

// Queries
generate_pocket_query_call!(icrc1_balance_of);
generate_pocket_query_call!(icrc1_total_supply);
generate_pocket_query_call!(icrc1_minting_account);

// Updates
generate_pocket_update_call!(icrc1_transfer);

pub mod client {
    use super::*;
    use candid::Principal;
    use icrc_ledger_types::icrc1::account::Subaccount;
    use pocket_ic::PocketIc;
    use types::CanisterId;

    pub fn transfer<A: Into<Nat>>(
        pic: &PocketIc,
        sender: Principal,
        ledger_canister_id: CanisterId,
        from: Option<Subaccount>,
        recipient: impl Into<Account>,
        amount: A,
    ) -> icrc1_transfer::Response {
        icrc1_transfer(
            pic,
            sender,
            ledger_canister_id,
            &TransferArg {
                from_subaccount: from,
                to: recipient.into(),
                fee: None,
                created_at_time: None,
                memo: None,
                amount: amount.into(),
            },
        )
    }

    pub fn balance_of(
        pic: &PocketIc,
        ledger_canister_id: CanisterId,
        account: impl Into<Account>,
    ) -> icrc1_balance_of::Response {
        icrc1_balance_of(
            pic,
            Principal::anonymous(),
            ledger_canister_id,
            &account.into(),
        )
    }

    pub fn total_supply(
        pic: &PocketIc,
        ledger_canister_id: CanisterId,
    ) -> icrc1_total_supply::Response {
        icrc1_total_supply(pic, Principal::anonymous(), ledger_canister_id, &())
    }
}
