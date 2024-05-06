use crate::{ generate_query_call, generate_update_call };

// Queries
generate_query_call!(account_balance_dfx);
generate_query_call!(name);
generate_query_call!(icrc1_total_supply);

// Updates
generate_update_call!(transfer);

pub mod account_balance_dfx {
    use ic_ledger_types::Tokens;
    use ogy_legacy_ledger_canister::AccountBalanceArgs;

    pub type Args = AccountBalanceArgs;
    pub type Response = Tokens;
}

pub mod transfer {
    use ic_ledger_types::{ BlockIndex, TransferArgs };
    use ogy_legacy_ledger_canister::TransferError;

    pub type Args = TransferArgs;
    pub type Response = Result<BlockIndex, TransferError>;
}

pub mod icrc1_total_supply {
    pub use ogy_legacy_ledger_canister::icrc1_total_supply::{ Args, Response };
}
pub mod name {
    pub use ogy_legacy_ledger_canister::name::{ Args, Response };
}

pub mod happy_path {
    use super::*;
    use candid::Principal;
    use ic_ledger_types::{ AccountIdentifier, Memo };
    use ic_ledger_types::Tokens;
    use pocket_ic::PocketIc;
    use types::CanisterId;
    use utils::consts::E8S_FEE_OGY;

    pub fn mint_ogy(
        pic: &mut PocketIc,
        minting_account: Principal,
        ledger_canister_id: CanisterId,
        recipient: impl Into<AccountIdentifier>,
        amount: u64
    ) -> transfer::Response {
        transfer(
            pic,
            minting_account,
            ledger_canister_id,
            &(transfer::Args {
                from_subaccount: None,
                to: recipient.into(),
                fee: Tokens::from_e8s(0),
                created_at_time: None,
                memo: Memo(0),
                amount: Tokens::from_e8s(amount),
            })
        )
    }
    pub fn transfer_ogy(
        pic: &mut PocketIc,
        sender: Principal,
        ledger_canister_id: CanisterId,
        recipient: impl Into<AccountIdentifier>,
        amount: u64
    ) -> transfer::Response {
        transfer(
            pic,
            sender,
            ledger_canister_id,
            &(transfer::Args {
                from_subaccount: None,
                to: recipient.into(),
                fee: Tokens::from_e8s(E8S_FEE_OGY),
                created_at_time: None,
                memo: Memo(0),
                amount: Tokens::from_e8s(amount),
            })
        )
    }

    pub fn balance_of(
        pic: &PocketIc,
        ledger_canister_id: CanisterId,
        account: String
    ) -> account_balance_dfx::Response {
        account_balance_dfx(
            pic,
            Principal::anonymous(),
            ledger_canister_id,
            &(account_balance_dfx::Args {
                account,
            })
        )
    }
    pub fn total_supply(
        pic: &PocketIc,
        ledger_canister_id: CanisterId
    ) -> icrc1_total_supply::Response {
        icrc1_total_supply(pic, Principal::anonymous(), ledger_canister_id, &())
    }
    pub fn token_name(pic: &PocketIc, ledger_canister_id: CanisterId) -> name::Response {
        name(pic, Principal::anonymous(), ledger_canister_id, &())
    }
}
