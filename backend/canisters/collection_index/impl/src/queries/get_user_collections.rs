use candid::Principal;
use canister_tracing_macros::trace;
use collection_index_api::collection::Collection;
pub use collection_index_api::get_user_collections::{
    Args as GetUserCollectionsArgs,
    Response as GetUserCollectionsResponse,
};
use futures::{ future::join_all, stream::Collect };
use ic_cdk::{ query, update };
use origyn_nft_reference::origyn_nft_reference_canister::{ Account3 as Account };
use origyn_nft_reference_c2c_client::icrc7_tokens_of;
use utils::env::Environment;
use crate::{ state::{ mutate_state, read_state }, utils::trace };

#[update]
#[trace]
pub async fn get_user_collections(args: GetUserCollectionsArgs) -> GetUserCollectionsResponse {
    let user_principal = args.unwrap_or(read_state(|s| s.env.caller()));
    let collections = read_state(|s| s.data.collections.get_all_collections());
    let futures: Vec<_> = collections
        .iter()
        .map(|collection| user_owns_an_nft_in_collection(&user_principal, collection))
        .collect();

    let res: Vec<Option<Collection>> = join_all(futures).await;
    let res: Vec<Collection> = res
        .into_iter()
        .filter_map(|result| result)
        .collect();

    res
}

async fn user_owns_an_nft_in_collection(
    user_principal: &Principal,
    collection: &Collection
) -> Option<Collection> {
    match
        icrc7_tokens_of(
            collection.canister_id,
            &(Account {
                owner: user_principal.clone(),
                subaccount: None,
            })
        ).await
    {
        Ok(ids) => {
            if ids.len() > 0 { Some(collection.clone()) } else { None }
        }
        Err(e) => { None }
    }
}
