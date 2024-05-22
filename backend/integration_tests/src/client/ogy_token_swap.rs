use crate::{ generate_query_call, generate_update_call };

// Queries
generate_query_call!(get_swap_info);
generate_query_call!(list_requesting_principals);

// Updates
generate_update_call!(recover_stuck_burn);
generate_update_call!(recover_stuck_transfer);
generate_update_call!(request_deposit_account);
generate_update_call!(swap_tokens);
generate_update_call!(update_swap_status);
generate_update_call!(withdraw_deposit);

pub mod get_swap_info {
    pub use ogy_token_swap_api::queries::get_swap_info::{ Args, Response };
}
pub mod list_requesting_principals {
    pub use ogy_token_swap_api::queries::list_requesting_principals::{ Args, Response };
}
pub mod request_deposit_account {
    pub use ogy_token_swap_api::updates::request_deposit_account::{ Args, Response };
}
pub mod swap_tokens {
    pub use ogy_token_swap_api::updates::swap_tokens::{ Args, Response };
}
pub mod update_swap_status {
    pub use ogy_token_swap_api::updates::update_swap_status::{ Args, Response };
}
pub mod recover_stuck_burn {
    pub use ogy_token_swap_api::updates::recover_stuck_burn::{ Args, Response };
}
pub mod recover_stuck_transfer {
    pub use ogy_token_swap_api::updates::recover_stuck_transfer::{ Args, Response };
}
pub mod withdraw_deposit {
    pub use ogy_token_swap_api::updates::withdraw_deposit::{ Args, Response };
}

pub mod client {
    use super::*;
    use candid::Principal;
    use ic_ledger_types::BlockIndex;
    use ogy_token_swap_api::token_swap::{
        BurnRequestArgs,
        RecoverBurnMode,
        RecoverTransferMode,
        SwapStatus,
    };
    use pocket_ic::PocketIc;
    use types::CanisterId;

    pub fn swap_tokens_authenticated_call(
        pic: &mut PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId,
        block_index: BlockIndex
    ) -> swap_tokens::Response {
        swap_tokens(
            pic,
            sender,
            ogy_token_swap_canister_id,
            &(swap_tokens::Args {
                block_index,
                user: None,
            })
        )
    }
    pub fn swap_tokens_anonymous_call(
        pic: &mut PocketIc,
        ogy_token_swap_canister_id: CanisterId,
        user: Principal,
        block_index: BlockIndex
    ) -> swap_tokens::Response {
        swap_tokens(
            pic,
            Principal::anonymous(),
            ogy_token_swap_canister_id,
            &(swap_tokens::Args {
                block_index,
                user: Some(user),
            })
        )
    }

    pub fn deposit_account(
        pic: &mut PocketIc,
        ogy_token_swap_canister_id: CanisterId,
        user: Principal
    ) -> request_deposit_account::Response {
        request_deposit_account(
            pic,
            Principal::anonymous(),
            ogy_token_swap_canister_id,
            &(request_deposit_account::Args { of: Some(user) })
        )
    }

    pub fn swap_info(
        pic: &PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId,
        block_index: BlockIndex
    ) -> get_swap_info::Response {
        get_swap_info(
            pic,
            sender,
            ogy_token_swap_canister_id,
            &(get_swap_info::Args { block_index })
        )
    }
    pub fn requesting_principals(
        pic: &PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId
    ) -> list_requesting_principals::Response {
        list_requesting_principals(pic, sender, ogy_token_swap_canister_id, &())
    }

    pub fn manipulate_swap_status(
        pic: &mut PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId,
        block_index: BlockIndex,
        swap_status: SwapStatus
    ) -> update_swap_status::Response {
        update_swap_status(
            pic,
            sender,
            ogy_token_swap_canister_id,
            &(update_swap_status::Args {
                block_index,
                swap_status,
            })
        )
    }

    pub fn recover_stuck_burn_call(
        pic: &mut PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId,
        block_index: BlockIndex,
        recover_mode: RecoverBurnMode,
        validation_data: Option<BurnRequestArgs>
    ) -> recover_stuck_burn::Response {
        recover_stuck_burn(
            pic,
            sender,
            ogy_token_swap_canister_id,
            &(recover_stuck_burn::Args {
                block_index,
                recover_mode,
                validation_data,
            })
        )
    }
    pub fn recover_stuck_transfer_call(
        pic: &mut PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId,
        block_index: BlockIndex,
        recover_mode: RecoverTransferMode
    ) -> recover_stuck_transfer::Response {
        recover_stuck_transfer(
            pic,
            sender,
            ogy_token_swap_canister_id,
            &(recover_stuck_transfer::Args {
                block_index,
                recover_mode,
            })
        )
    }
    pub fn withdraw_deposit_call(
        pic: &mut PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId
    ) -> withdraw_deposit::Response {
        withdraw_deposit(pic, sender, ogy_token_swap_canister_id, &())
    }
}
