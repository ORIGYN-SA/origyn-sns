use std::borrow::Cow;

use candid::{ CandidType, Decode, Encode, Principal };
use ic_stable_structures::{ storable::Bound, Storable };
use serde::{ Deserialize, Serialize };

pub type CollectionCanisterId = Principal;
pub type CertificateTokenId = String;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Collection {
    pub canister_id: Principal,
    pub name: Option<String>,
    pub category: String,
    pub is_promoted: bool,
}

impl From<crate::services::origyn_nft::GetCollectionInfoResult> for Collection {
    fn from(value: crate::services::origyn_nft::GetCollectionInfoResult) -> Self {
        Self {
            name: value.name,
            canister_id: Principal::anonymous(),
            category: String::new(),
            is_promoted: false,
        }
    }
}

impl Storable for Collection {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }
}
