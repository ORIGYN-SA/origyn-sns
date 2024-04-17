use candid::Principal;
use canister_time::{now_millis, run_now_then_interval, DAY_IN_MS};
use icrc_ledger_canister_c2c_client::icrc1_balance_of;
use sns_governance_canister::types::{Neuron, NeuronId};
use std::collections::BTreeMap as NormalBTreeMap;
use std::time::Duration;
use tracing::{debug, error, info};
use types::Milliseconds;

use crate::state::{mutate_state, read_state, GovernanceStats};

const SYNC_SUPPLY_DATA_INTERVAL: Milliseconds = 3_600 * 1_000;

pub fn start_job() {
    debug!("Starting the sync supply data job...");
    run_now_then_interval(Duration::from_millis(SYNC_SUPPLY_DATA_INTERVAL), run)
}

pub fn run() {
    ic_cdk::spawn(sync_supply_data())
}

pub async fn sync_supply_data() {
    match icrc_ledger_canister_c2c_client::icrc1_name(canister_id).await {
        Ok(response) => {
            info!("{:?}", response);
        }
        Err(err) => {
            let message = format!("{err:?}");
            error!(?message, "Error while getting the total supply data");
        }
    }
}
