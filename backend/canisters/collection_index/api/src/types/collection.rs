use std::borrow::Cow;

use candid::{CandidType, Decode, Encode, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};

pub type CollectionCanisterId = Principal;
pub type CertificateTokenId = String;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Collection {
    pub canister_id: Principal,
    pub name: Option<String>,
    pub category: Option<String>,
    pub is_promoted: bool,
    pub locked_value_usd: Option<u64>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct CollectionExtended {
    pub canister_id: Principal,
    pub name: Option<String>,
    pub category: Option<String>,
    pub is_promoted: bool,
    pub total_supply: Option<u64>,
    pub item_price_usd: Option<u64>,
}

impl From<crate::services::origyn_nft::GetCollectionInfoResult> for Collection {
    fn from(value: crate::services::origyn_nft::GetCollectionInfoResult) -> Self {
        Self {
            name: value.name,
            canister_id: Principal::anonymous(),
            category: None,
            is_promoted: false,
            locked_value_usd: None,
        }
    }
}

impl From<crate::services::origyn_nft::GetCollectionInfoResult> for CollectionExtended {
    fn from(value: crate::services::origyn_nft::GetCollectionInfoResult) -> Self {
        Self {
            name: value.name,
            canister_id: Principal::anonymous(),
            category: None,
            is_promoted: false,
            total_supply: None,
            item_price_usd: None,
        }
    }
}

impl From<CollectionExtended> for Collection {
    fn from(val: CollectionExtended) -> Self {
        let locked_value_usd = match (val.item_price_usd, val.total_supply) {
            (Some(price), Some(supply)) => Some(price.saturating_mul(supply)),
            _ => None,
        };
        Collection {
            canister_id: val.canister_id,
            name: val.name,
            category: val.category,
            is_promoted: val.is_promoted,
            locked_value_usd,
        }
    }
}

impl Storable for CollectionExtended {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn into_bytes(self) -> std::vec::Vec<u8> {
        Encode!(&self).unwrap()
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }
}

impl Storable for Collection {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn into_bytes(self) -> std::vec::Vec<u8> {
        Encode!(&self).unwrap()
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }
}

pub struct GetCollectionsFilters {
    pub categories: Option<Vec<String>>,
}
