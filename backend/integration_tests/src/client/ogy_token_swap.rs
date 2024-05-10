use crate::{ generate_query_call, generate_update_call };

// Queries
generate_query_call!(get_swap_info);

// Updates
generate_update_call!(request_deposit_account);
generate_update_call!(swap_tokens);

pub mod swap_tokens {
    pub use ogy_token_swap_api::updates::swap_tokens::{ Args, Response };
}

pub mod request_deposit_account {
    pub use ogy_token_swap_api::updates::request_deposit_account::{ Args, Response };
}
pub mod get_swap_info {
    pub use ogy_token_swap_api::queries::get_swap_info::{ Args, Response };
}

pub mod client {
    use super::*;
    use candid::Principal;
    use ic_ledger_types::BlockIndex;
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
}
