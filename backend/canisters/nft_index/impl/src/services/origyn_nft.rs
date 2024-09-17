use candid::Principal;
use nft_index_api::origyn_nft::{ GetCollectionInfoError, GetCollectionInfoResult };

pub async fn get_collection_info(
    collection_canister_id: Principal
) -> Result<GetCollectionInfoResult, GetCollectionInfoError> {
    let result = origyn_nft_reference_c2c_client::collection_nft_origyn(
        collection_canister_id,
        &None
    ).await;

    match result {
        Ok(result) => {
            match result {
                origyn_nft_reference::origyn_nft_reference_canister::CollectionResult::Ok(data) => {
                    return Ok(data.into());
                }
                origyn_nft_reference::origyn_nft_reference_canister::CollectionResult::Err(err) => {
                    return Err(GetCollectionInfoError::GenericOrigynNftError(err.text));
                }
            }
        }
        Err(e) => {
            return Err(GetCollectionInfoError::CanisterToCanisterCallError(e.1));
        }
    }
}
