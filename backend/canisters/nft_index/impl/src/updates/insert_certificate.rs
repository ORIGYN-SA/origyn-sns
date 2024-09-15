use canister_tracing_macros::trace;
pub use nft_index_api::insert_certificates::{
    Args as InsertCertificateArgs,
    Response as InsertCertificateResponse,
};
use ic_cdk::update;
use crate::{ guards::caller_is_authorised_principal, state::{ mutate_state, read_state } };

#[update(guard = "caller_is_authorised_principal")]
#[trace]
pub async fn insert_certificate(certificate: InsertCertificateArgs) -> InsertCertificateResponse {
    Ok(mutate_state(|state| state.data.insert_certificate(certificate))?)
}
