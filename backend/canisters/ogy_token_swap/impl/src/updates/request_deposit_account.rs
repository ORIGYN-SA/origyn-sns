use candid::Principal;
use ic_cdk::update;
use ic_ledger_types::{ AccountIdentifier, Subaccount };
use utils::env::Environment;

use crate::state::{ mutate_state, read_state };

#[update]
fn request_deposit_account(of: Option<Principal>) -> AccountIdentifier {
    let principal = of.unwrap_or(read_state(|s| s.env.caller()));
    mutate_state(|s| s.data.deposit_principals.insert(principal));
    compute_deposit_account(&principal)
}

pub fn compute_deposit_account(principal: &Principal) -> AccountIdentifier {
    AccountIdentifier::new(&read_state(|s| s.env.canister_id()), &Subaccount::from(*principal))
}

#[cfg(test)]
mod tests {
    use candid::Principal;
    use ic_ledger_types::{ AccountIdentifier, Subaccount };
    use utils::env::CanisterEnv;

    use crate::{
        updates::request_deposit_account::compute_deposit_account,
        state::{ init_state, Data, RuntimeState },
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

    fn init_canister_state() {
        let ogy_legacy_ledger_canister_id = Principal::from_text(
            "jwcfb-hyaaa-aaaaj-aac4q-cai"
        ).unwrap();
        let ogy_new_ledger_canister_id = Principal::from_text(
            "tr3th-kiaaa-aaaaq-aab6q-cai"
        ).unwrap();

        let env = CanisterEnv::new(false);
        let data = Data::new(ogy_new_ledger_canister_id, ogy_legacy_ledger_canister_id);

        let runtime_state = RuntimeState::new(env, data);

        init_state(runtime_state);
    }
}
