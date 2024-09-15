use candid::{ CandidType, Principal };
use nft_index_api::certificate::Certificate;
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
            total_certificates: self.data.certificates.len() as u64,
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
    pub total_certificates: u64,
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
    pub certificates: BTreeMap<String, Certificate>,
    pub collection_index: BTreeMap<String, BTreeSet<String>>,
    pub category_index: BTreeMap<String, BTreeSet<String>>,
    pub authorised_principals: Vec<Principal>,
}

impl Data {
    pub fn new(authorised_principals: Vec<Principal>) -> Self {
        Self {
            certificates: BTreeMap::new(),
            authorised_principals,
            collection_index: BTreeMap::new(),
            category_index: BTreeMap::new(),
        }
    }

    pub fn insert_certificate(&mut self, certificate: Certificate) -> Result<bool, String> {
        let certificate_id = certificate.clone().certificate_id;
        if self.certificates.contains_key(&certificate_id) {
            return Err("Certificate ID already exists.".to_string());
        }

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

    pub fn get_certificates_by_collection_id(
        &self,
        collection_id: String,
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
