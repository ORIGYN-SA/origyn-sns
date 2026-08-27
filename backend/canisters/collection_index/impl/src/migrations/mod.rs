use crate::state::{RuntimeState, Data};
use crate::model::collection::CollectionModel;
use crate::model::gold_collections::GoldCollectionsConfig;
use std::collections::HashMap;
use candid::Principal;

use self::types::state::{RuntimeStateV0, DataV0, CollectionModelV0};

pub mod types;

impl From<RuntimeStateV0> for RuntimeState {
    fn from(old_state: RuntimeStateV0) -> Self {
        Self {
            env: old_state.env,
            data: old_state.data.into(),
        }
    }
}

impl From<DataV0> for Data {
    fn from(old_data: DataV0) -> Self {
        Self {
            authorised_principals: old_data.authorised_principals,
            collections: old_data.collections.into(),
            gold_collections_config: GoldCollectionsConfig::default(),
            overall_stats: old_data.overall_stats,
            claimlink_canister_id: Principal::from_text("uasjq-dyaaa-aaaas-qdwka-cai").unwrap(),
            is_syncing_collections: false,
            is_syncing_supplies: false,
        }
    }
}

impl From<CollectionModelV0> for CollectionModel {
    fn from(old_model: CollectionModelV0) -> Self {
        let mut new_model = CollectionModel::default();
        new_model.categories = old_model.categories;
        new_model
    }
}
