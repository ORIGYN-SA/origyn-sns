use candid::Principal;
use ic_cdk::update;
use ic_ledger_types::{ AccountIdentifier, Subaccount };
use utils::env::Environment;

pub use ogy_token_swap_api::updates::request_deposit_account::{
    Args as RequestDepositAccountArgs,
    Response as RequestDepositAccountResponse,
};

use crate::state::{ mutate_state, read_state };

#[update]
fn request_deposit_account(args: RequestDepositAccountArgs) -> RequestDepositAccountResponse {
    let principal = args.of.unwrap_or(read_state(|s| s.env.caller()));

    // check if there is room in the swaps heap
    if read_state(|s| s.data.token_swap.is_capacity_full()) {
        return RequestDepositAccountResponse::MaxCapacityOfSwapsReached;
    }

    if let Err(error_response) = mutate_state(|s| s.data.requesting_principals.insert(principal)) {
        return error_response;
    }
    RequestDepositAccountResponse::Success(compute_deposit_account(&principal))
}

pub fn compute_deposit_account(principal: &Principal) -> AccountIdentifier {
    AccountIdentifier::new(&read_state(|s| s.env.canister_id()), &Subaccount::from(*principal))
}

#[cfg(test)]
mod tests {
    use candid::Principal;
    use ic_ledger_types::{ AccountIdentifier, Subaccount };
    use ogy_token_swap_api::requesting_principals::LIST_MAX_LIMIT;
    use utils::env::CanisterEnv;

    pub use ogy_token_swap_api::updates::request_deposit_account::{
        Args as RequestDepositAccountArgs,
        Response as RequestDepositAccountResponse,
    };

    use crate::{
        state::{ init_state, mutate_state, Data, RuntimeState },
        updates::request_deposit_account::{ compute_deposit_account, request_deposit_account },
    };

    const DUMMY_USER: &str = "465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae";

    #[test]
    fn test_compute_deposit_account() {
        init_canister_state();
        let result = compute_deposit_account(&Principal::from_text(DUMMY_USER).unwrap());
        let expected_result = AccountIdentifier::new(
            &Principal::anonymous(), // testing env doesn't have canister id and it's set to anonymous principal
            &Subaccount::from(Principal::from_text(DUMMY_USER).unwrap())
        );

        assert_eq!(expected_result, result)
    }

    #[test]
    fn test_limit_reached() {
        init_canister_state();

        for ind in 0..LIST_MAX_LIMIT {
            let p = dummy_principal(ind as u64);
            let expected_result = AccountIdentifier::new(
                &Principal::anonymous(), // testing env doesn't have canister id and it's set to anonymous principal
                &Subaccount::from(p)
            );
            assert_eq!(
                RequestDepositAccountResponse::Success(expected_result),
                request_deposit_account(RequestDepositAccountArgs {
                    of: Some(dummy_principal(ind as u64)),
                })
            );
        }

        assert_eq!(
            RequestDepositAccountResponse::MaxCapacityOfListReached,
            request_deposit_account(RequestDepositAccountArgs {
                of: Some(dummy_principal(LIST_MAX_LIMIT as u64)),
            })
        );
    }

    #[test]
    fn test_swaps_limit_reached() {
        init_canister_state();
        let max_heap_swaps = 4_700_000;
        for i in 0..max_heap_swaps {
            mutate_state(|s| s.data.token_swap.init_swap(i, dummy_principal(i)).unwrap());
        }

        assert_eq!(
            RequestDepositAccountResponse::MaxCapacityOfSwapsReached,
            request_deposit_account(RequestDepositAccountArgs {
                of: Some(dummy_principal(1)),
            })
        );
    }

    fn init_canister_state() {
        let ogy_legacy_ledger_canister_id = Principal::from_text(
            "jwcfb-hyaaa-aaaaj-aac4q-cai"
        ).unwrap();
        let ogy_new_ledger_canister_id = Principal::from_text(
            "tr3th-kiaaa-aaaaq-aab6q-cai"
        ).unwrap();
        let ogy_legacy_minting_account_principal = Principal::from_text(
            "aomfs-vaaaa-aaaaj-aadoa-cai"
        ).unwrap();

        let env = CanisterEnv::new(false);
        let data = Data::new(
            ogy_new_ledger_canister_id,
            ogy_legacy_ledger_canister_id,
            ogy_legacy_minting_account_principal,
            vec![]
        );

        let runtime_state = RuntimeState::new(env, data);

        init_state(runtime_state);
    }

    fn dummy_principal(index: u64) -> Principal {
        Principal::from_slice(&index.to_ne_bytes())
    }
}
