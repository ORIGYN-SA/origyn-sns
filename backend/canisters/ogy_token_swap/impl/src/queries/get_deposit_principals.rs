use candid::Principal;
use ic_cdk::query;

use crate::state::read_state;

pub type GetDepositPrincipalsResponse = Vec<Principal>;

#[query(hidden = true)]
async fn get_deposit_principals() -> GetDepositPrincipalsResponse {
    get_deposit_principals_impl()
}

fn get_deposit_principals_impl() -> Vec<Principal> {
    read_state(|s| { s.data.deposit_principals.get() })
}
