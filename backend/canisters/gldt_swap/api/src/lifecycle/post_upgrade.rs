use bity_ic_types::BuildVersion;
use candid::CandidType;
use gldt_swap_common::bridge::BridgeUpgrade;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct UpgradeArgs {
    pub version: BuildVersion,
    pub commit_hash: String,
    /// Replaces the bridge config and restarts stopped chains. `None` keeps the bridge as it is.
    pub bridge: Option<BridgeUpgrade>,
}
