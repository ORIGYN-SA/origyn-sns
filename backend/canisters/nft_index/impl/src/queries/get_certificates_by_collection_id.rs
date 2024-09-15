use canister_tracing_macros::trace;
pub use nft_index_api::get_certificates_by_collection_id::{
    Args as GetCertificatesByCollectionArgs,
    Response as GetCertificatesByCollectionResponse,
};
use ic_cdk::query;
use crate::state::mutate_state;

#[query]
#[trace]
pub async fn get_certificates_by_collection_id(
    args: GetCertificatesByCollectionArgs
) -> GetCertificatesByCollectionResponse {
    Ok(
        mutate_state(|state|
            state.data.get_certificates_by_collection_id(
                args.collection_id,
                args.offset,
                args.limit
            )
        )
    )
}
