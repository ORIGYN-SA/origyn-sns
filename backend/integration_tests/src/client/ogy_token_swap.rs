use crate::{ generate_query_call, generate_update_call };

// Queries
generate_query_call!(request_deposit_account);
generate_query_call!(get_swap_info);

// Updates
generate_update_call!(swap_tokens);

pub mod swap_tokens {
    use ogy_token_swap::updates::swap_tokens::{ SwapTokensRequest, SwapTokensResponse };

    pub type Args = SwapTokensRequest;
    pub type Response = SwapTokensResponse;
}

pub mod request_deposit_account {
    use candid::Principal;
    use ic_ledger_types::AccountIdentifier;

    pub type Args = Principal;
    pub type Response = AccountIdentifier;
}
pub mod get_swap_info {
    use ic_ledger_types::BlockIndex;
    use ogy_token_swap::model::token_swap::SwapInfo;

    pub type Args = BlockIndex;
    pub type Response = Result<SwapInfo, String>;
}

pub mod happy_path {
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
        pic: &PocketIc,
        ogy_token_swap_canister_id: CanisterId,
        user: Principal
    ) -> request_deposit_account::Response {
        request_deposit_account(pic, Principal::anonymous(), ogy_token_swap_canister_id, &user)
    }

    pub fn swap_info(
        pic: &PocketIc,
        sender: Principal,
        ogy_token_swap_canister_id: CanisterId,
        block_index: BlockIndex
    ) -> get_swap_info::Response {
        get_swap_info(pic, sender, ogy_token_swap_canister_id, &block_index)
    }
}
