use candid::{ CandidType, Nat, Principal };
use serde::{ Deserialize, Serialize };

pub type CollectionCanisterId = Principal;
pub type CertificateTokenId = String;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Collection {
    pub name: Option<String>,
    pub logo_url: Option<String>,
    pub certificates_count: Nat,
    pub is_promoted: bool,
}

impl From<crate::services::origyn_nft::GetCollectionInfoResult> for Collection {
    fn from(value: crate::services::origyn_nft::GetCollectionInfoResult) -> Self {
        Self {
            name: value.name,
            logo_url: value.logo_url,
            certificates_count: value.certificates_count,
            is_promoted: false,
        }
    }
}

#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub struct Certificate {
    pub certificate_id: CertificateTokenId,
    pub collection_id: CollectionCanisterId,
    pub category: String,
}
