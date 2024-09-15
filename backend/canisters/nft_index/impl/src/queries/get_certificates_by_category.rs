use canister_tracing_macros::trace;
pub use nft_index_api::get_certificates_by_category::{
    Args as GetCertificatesByCategoryArgs,
    Response as GetCertificatesByCategoryResponse,
};
use ic_cdk::query;
use crate::state::mutate_state;

#[query]
#[trace]
pub async fn get_certificates_by_category(
    args: GetCertificatesByCategoryArgs
) -> GetCertificatesByCategoryResponse {
    Ok(
        mutate_state(|state|
            state.data.get_certificates_by_category(args.category, args.offset, args.limit)
        )
    )
}
