use candid::{ CandidType, Principal };
use nft_index_api::{
    certificate::{ Certificate, CertificateTokenId, Collection, CollectionCanisterId },
    errors::{ InsertCertificateError, InsertCollectionError },
};
use serde::{ Deserialize as SerdeDeserialize, Serialize };
use types::TimestampMillis;
use std::collections::{ BTreeMap, BTreeSet };
use utils::{ env::{ CanisterEnv, Environment }, memory::MemorySize };
use canister_state_macros::canister_state;
use ic_cdk::api::is_controller;

canister_state!(RuntimeState);

#[derive(Serialize, SerdeDeserialize)]
pub struct RuntimeState {
    /// Runtime environment
    pub env: CanisterEnv,
    /// Runtime data
    pub data: Data,
}

impl RuntimeState {
    pub fn new(env: CanisterEnv, data: Data) -> Self {
        Self { env, data }
    }

    pub fn metrics(&self) -> Metrics {
        Metrics {
            canister_info: CanisterInfo {
                now: self.env.now(),
                test_mode: self.env.is_test_mode(),
                memory_used: MemorySize::used(),
                cycles_balance_in_tc: self.env.cycles_balance_in_tc(),
            },
            total_certificates: self.data.certificates.len(),
            total_collections: self.data.collection_order.len(),
        }
    }

    pub fn is_caller_authorised_principal(&self) -> bool {
        let caller = self.env.caller();
        if is_controller(&caller) {
            return true;
        }
        self.data.authorised_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    pub total_certificates: usize,
    pub total_collections: usize,
}

#[derive(CandidType, Serialize, SerdeDeserialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: f64,
}

#[derive(Serialize, SerdeDeserialize)]
pub struct Data {
    /// Map of certificates keyed by certificate_id (String)
    pub certificates: BTreeMap<CertificateTokenId, Certificate>,
    /// Map of collections keyed by canister_id (Principal)
    pub collections: BTreeMap<CollectionCanisterId, Collection>,
    /// Ordered list of collection canister IDs, with promoted collections first
    pub collection_order: Vec<CollectionCanisterId>,
    /// Index for collection_id (Principal) to set of certificate_ids (String)
    pub collection_index: BTreeMap<CollectionCanisterId, BTreeSet<CertificateTokenId>>,
    /// Index for category (String) to set of certificate_ids (String)
    pub category_index: BTreeMap<String, BTreeSet<CertificateTokenId>>,
    /// Authorised principals for guarded calls
    pub authorised_principals: Vec<Principal>,
}

impl Data {
    pub fn new(authorised_principals: Vec<Principal>) -> Self {
        Self {
            certificates: BTreeMap::new(),
            collections: BTreeMap::new(),
            collection_order: Vec::new(),
            authorised_principals,
            collection_index: BTreeMap::new(),
            category_index: BTreeMap::new(),
        }
    }

    pub fn insert_certificate(
        &mut self,
        certificate: Certificate
    ) -> Result<bool, InsertCertificateError> {
        let certificate_id = certificate.certificate_id.clone();

        if self.certificates.contains_key(&certificate_id) {
            return Err(InsertCertificateError::CertificateAlreadyExists);
        }

        if !self.collections.contains_key(&certificate.collection_id) {
            return Err(InsertCertificateError::TargetCollectionDoesNotExist);
        }

        // Not sure if we need this?
        self.certificates.insert(certificate_id.clone(), certificate.clone());

        self.collection_index
            .entry(certificate.collection_id.clone())
            .or_insert_with(BTreeSet::new)
            .insert(certificate_id.clone());

        self.category_index
            .entry(certificate.category.clone())
            .or_insert_with(BTreeSet::new)
            .insert(certificate_id);

        Ok(true)
    }

    pub fn insert_collection(
        &mut self,
        collection_canister_id: Principal,
        collection: &Collection
    ) -> Result<bool, InsertCollectionError> {
        if self.collections.contains_key(&collection_canister_id) {
            return Err(InsertCollectionError::CollectionAlreadyExists);
        }

        self.collections.insert(collection_canister_id.clone(), collection.clone());

        if collection.is_promoted {
            self.collection_order.insert(0, collection_canister_id);
        } else {
            self.collection_order.push(collection_canister_id);
        }

        Ok(true)
    }

    pub fn get_all_collections(&self, offset: usize, limit: usize) -> Vec<Collection> {
        let collection_ids = &self.collection_order;

        collection_ids
            .iter()
            .skip(offset)
            .take(limit)
            .filter_map(|canister_id| self.collections.get(canister_id).cloned())
            .collect()
    }

    pub fn get_certificates_by_collection_id(
        &self,
        collection_id: CollectionCanisterId,
        offset: usize,
        limit: usize
    ) -> Vec<Certificate> {
        if let Some(cert_ids) = self.collection_index.get(&collection_id) {
            cert_ids
                .iter()
                .skip(offset)
                .take(limit)
                .filter_map(|cert_id| self.certificates.get(cert_id).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_certificates_by_category(
        &self,
        category: String,
        offset: usize,
        limit: usize
    ) -> Vec<Certificate> {
        if let Some(cert_ids) = self.category_index.get(&category) {
            cert_ids
                .iter()
                .skip(offset)
                .take(limit)
                .filter_map(|cert_id| self.certificates.get(cert_id).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }
}
