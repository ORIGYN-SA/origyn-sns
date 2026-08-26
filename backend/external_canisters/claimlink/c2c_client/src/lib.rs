use bity_ic_canister_client::generate_candid_c2c_call;
use claimlink::claimlink_canister::{CollectionsResult, ListAllCollectionsArgs};

pub mod list_all_collections {
    use super::*;

    pub type Args = ListAllCollectionsArgs;
    pub type Response = CollectionsResult;
}

generate_candid_c2c_call!(list_all_collections);
