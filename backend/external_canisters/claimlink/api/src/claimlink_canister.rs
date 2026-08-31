// Minimal candid bindings for the claimlink canister, covering only the
// `list_all_collections` query. Extend with more types/methods as other
// canisters in this workspace need to call claimlink.
#![allow(dead_code, unused_imports)]
use candid::{self, CandidType, Deserialize, Nat, Principal};
use serde::Serialize;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct PaginationArgs {
    pub offset: Option<u64>,
    pub limit: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CollectionMetadata {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub template_id: Nat,
    pub categories: Vec<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum CollectionStatus {
    Queued,
    Created,
    Installed,
    TemplateUploaded,
    Failed { reason: String, attempsts: Nat },
    ReimbursingQueued,
    Reimbursed { tx_index: Nat },
    QuarantinedReimbursement { reason: String },
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CollectionInfo {
    pub owner: Principal,
    pub collection_id: Nat,
    pub ogy_charged: Nat,
    pub metadata: CollectionMetadata,
    pub status: CollectionStatus,
    pub canister_id: Option<Principal>,
    pub wasm_hash: Option<String>,
    pub temaplte_url: Option<String>,
    pub created_at: Nat,
    pub updated_at: Nat,
    pub categories: Vec<String>,
    pub is_ai: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CollectionsResult {
    pub collections: Vec<CollectionInfo>,
    pub total_count: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, Default)]
pub struct ListAllCollectionsArgs {
    pub pagination: PaginationArgs,
    pub categories: Option<Vec<String>>,
}
