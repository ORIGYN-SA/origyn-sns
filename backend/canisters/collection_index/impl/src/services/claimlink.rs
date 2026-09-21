use candid::Principal;
use claimlink::claimlink_canister::{CollectionInfo, ListAllCollectionsArgs, PaginationArgs};
use tracing::debug;

const PAGE_SIZE: u64 = 100;

/// Walks every page of claimlink's `list_all_collections` and returns the
/// full set of collections it knows about.
pub async fn fetch_all_collections(
    claimlink_canister_id: Principal,
) -> Result<Vec<CollectionInfo>, String> {
    let mut offset = 0u64;
    let mut all = Vec::new();

    loop {
        let args = ListAllCollectionsArgs {
            pagination: PaginationArgs {
                offset: Some(offset),
                limit: Some(PAGE_SIZE),
            },
            categories: None,
        };

        let response = claimlink_c2c_client::list_all_collections(claimlink_canister_id, &args)
            .await
            .map_err(|e| format!("{e:?}"))?;

        let page_len = response.collections.len() as u64;
        all.extend(response.collections);

        if page_len < PAGE_SIZE || all.len() as u64 >= response.total_count {
            break;
        }
        offset += PAGE_SIZE;
    }

    debug!("fetched {} collections from claimlink", all.len());
    Ok(all)
}
