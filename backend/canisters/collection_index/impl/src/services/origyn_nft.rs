use candid::Principal;
use collection_index_api::origyn_nft::{ GetCollectionInfoError, GetCollectionInfoResult };
use tracing::{ info, debug };

pub async fn get_collection_info(
    collection_canister_id: Principal
) -> Result<GetCollectionInfoResult, GetCollectionInfoError> {
    let result = origyn_nft_reference_c2c_client::collection_nft_origyn(
        collection_canister_id,
        &None
    ).await;

    debug!("{result:?}");
    match result {
        Ok(result) => {
            match result {
                origyn_nft_reference::origyn_nft_reference_canister::CollectionResult::Ok(data) => {
                    return Ok(data.into());
                }
                origyn_nft_reference::origyn_nft_reference_canister::CollectionResult::Err(err) => {
                    debug!("{err:?}");
                    return Err(GetCollectionInfoError::GenericOrigynNftError(format!("{err:?}")));
                }
            }
        }
        Err(e) => {
            return Err(GetCollectionInfoError::CanisterToCanisterCallError(format!("{e:?}")));
        }
    }
}
