use bity_ic_canister_time::now_nanos;
use bity_ic_types::BuildVersion;
use candid::Principal;
use serde::{Deserialize, Serialize};
use types::{CanisterId, Cycles, TimestampMillis, TimestampNanos};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct CanisterEnv {
    test_mode: bool,
    version: BuildVersion,
    commit_hash: String,
}

pub trait Environment {
    fn now_nanos(&self) -> TimestampNanos;
    fn caller(&self) -> Principal;
    fn canister_id(&self) -> CanisterId;
    fn cycles_balance(&self) -> Cycles;

    fn now(&self) -> TimestampMillis {
        self.now_nanos() / 1_000_000
    }

    fn cycles_balance_in_tc(&self) -> u128 {
        (self.cycles_balance() as u128) / 1_000_000_000_000u128
    }
}

impl CanisterEnv {
    pub fn new(test_mode: bool, version: BuildVersion, commit_hash: String) -> Self {
        Self {
            test_mode,
            version,
            commit_hash,
        }
    }

    pub fn is_test_mode(&self) -> bool {
        self.test_mode
    }

    pub fn version(&self) -> BuildVersion {
        self.version
    }

    pub fn set_version(&mut self, version: BuildVersion) {
        self.version = version;
    }

    pub fn commit_hash(&self) -> &str {
        &self.commit_hash
    }

    pub fn set_commit_hash(&mut self, commit_hash: String) {
        self.commit_hash = commit_hash;
    }
}

impl Environment for CanisterEnv {
    fn now_nanos(&self) -> TimestampNanos {
        now_nanos()
    }

    #[cfg(target_arch = "wasm32")]
    fn caller(&self) -> Principal {
        ic_cdk::caller()
    }
    #[cfg(not(target_arch = "wasm32"))]
    fn caller(&self) -> Principal {
        Principal::anonymous()
    }

    #[cfg(target_arch = "wasm32")]
    fn canister_id(&self) -> CanisterId {
        ic_cdk::id()
    }
    #[cfg(not(target_arch = "wasm32"))]
    fn canister_id(&self) -> CanisterId {
        Principal::anonymous()
    }

    #[cfg(target_arch = "wasm32")]
    fn cycles_balance(&self) -> Cycles {
        ic_cdk::api::canister_cycle_balance().into()
    }
    #[cfg(not(target_arch = "wasm32"))]
    fn cycles_balance(&self) -> Cycles {
        0
    }
}


#[derive(Default, Serialize, Deserialize, Clone)]
pub struct CanisterEnvV0 {
    test_mode: bool,
}

impl CanisterEnvV0 {
    pub fn new(test_mode: bool) -> Self {
        Self { test_mode }
    }

    pub fn is_test_mode(&self) -> bool {
        self.test_mode
    }
}

impl Environment for CanisterEnvV0 {
    fn now_nanos(&self) -> TimestampNanos {
        now_nanos()
    }

    #[cfg(target_arch = "wasm32")]
    fn caller(&self) -> Principal {
        ic_cdk::caller()
    }
    #[cfg(not(target_arch = "wasm32"))]
    fn caller(&self) -> Principal {
        Principal::anonymous()
    }

    #[cfg(target_arch = "wasm32")]
    fn canister_id(&self) -> CanisterId {
        ic_cdk::id()
    }
    #[cfg(not(target_arch = "wasm32"))]
    fn canister_id(&self) -> CanisterId {
        Principal::anonymous()
    }

    #[cfg(target_arch = "wasm32")]
    fn cycles_balance(&self) -> Cycles {
        ic_cdk::api::canister_balance().into()
    }
    #[cfg(not(target_arch = "wasm32"))]
    fn cycles_balance(&self) -> Cycles {
        0
    }
}

impl From<CanisterEnvV0> for CanisterEnv {
    fn from(v0: CanisterEnvV0) -> Self {
        Self {
            test_mode: v0.test_mode,
            version: BuildVersion::default(),
            commit_hash: String::new(),
        }
    }
}
