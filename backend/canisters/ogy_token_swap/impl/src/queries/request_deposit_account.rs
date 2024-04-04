use candid::Principal;
use ic_cdk::{api, query};
use ic_ledger_types::{AccountIdentifier, Subaccount};

#[query]
async fn request_deposit_account(of: Option<Principal>) -> AccountIdentifier {
    let subaccount: Subaccount = match of {
        Some(principal) => Subaccount::from(principal),
        None => Subaccount::from(api::caller()),
    };
    AccountIdentifier::new(&api::id(), &subaccount)
}
