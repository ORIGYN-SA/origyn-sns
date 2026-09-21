use candid::Principal;
use serde::Deserialize;
use candid::CandidType;
use serde::Serialize;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GoldCollectionsConfig {
    pub canister_id_1g: Option<Principal>,
    pub canister_id_10g: Option<Principal>,
    pub canister_id_100g: Option<Principal>,
    pub canister_id_1kg: Option<Principal>,
}

impl Default for GoldCollectionsConfig {
    fn default() -> Self {
        Self {
            canister_id_1g:  Some(Principal::from_text("io7gn-vyaaa-aaaak-qcbiq-cai").unwrap()),
            canister_id_10g:  Some(Principal::from_text("sy3ra-iqaaa-aaaao-aixda-cai").unwrap()),
            canister_id_100g:  Some(Principal::from_text("zhfjc-liaaa-aaaal-acgja-cai").unwrap()),
            canister_id_1kg: Some(Principal::from_text("7i7jl-6qaaa-aaaam-abjma-cai").unwrap()),
        }
    }
}