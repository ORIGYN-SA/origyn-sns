use candid::{ CandidType, Nat, Principal };
use canister_state_macros::canister_state;
use icrc_ledger_types::icrc1::account::Account;
use serde::{ Deserialize, Serialize };
use sns_governance_canister::types::NeuronId;
use super_stats_v3_c2c_client::helpers::account_tree::Overview as LedgerOverview;
use std::{ collections::BTreeMap, ops::Add };
use types::{ CanisterId, TimestampMillis };
use utils::{
    consts::{ SNS_GOVERNANCE_CANISTER_ID, SNS_LEDGER_CANISTER_ID, SUPER_STATS_CANISTER_ID },
    env::{ CanisterEnv, Environment },
    memory::MemorySize,
};

canister_state!(RuntimeState);

#[derive(Serialize, Deserialize)]
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
            sync_info: self.data.sync_info,
            number_of_owners: self.data.principal_neurons.len(),
            sns_governance_canister: self.data.sns_governance_canister,
            sns_ledger_canister: self.data.sns_ledger_canister,
        }
    }

    pub fn is_caller_authorised_principal(&self) -> bool {
        let caller = self.env.caller();
        self.data.authorized_principals.contains(&caller)
    }
}

#[derive(CandidType, Serialize)]
pub struct Metrics {
    pub canister_info: CanisterInfo,
    // Do we need the canister ids here?
    pub sns_governance_canister: Principal,
    pub sns_ledger_canister: Principal,
    pub number_of_owners: usize,
    pub sync_info: SyncInfo,
}

#[derive(CandidType, Deserialize, Serialize)]
pub struct CanisterInfo {
    pub now: TimestampMillis,
    pub test_mode: bool,
    pub memory_used: MemorySize,
    pub cycles_balance_in_tc: f64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Copy, Default)]
pub struct SyncInfo {
    pub last_synced_start: TimestampMillis,
    pub last_synced_end: TimestampMillis,
    pub last_synced_number_of_neurons: usize,
    pub last_synced_transaction: usize,
}

#[derive(Serialize, Deserialize)]
pub struct Data {
    /// authorized Principals for guarded calls
    pub authorized_principals: Vec<Principal>,
    /// All stats about governance, total staked, unlocked, locked and rewards
    pub all_gov_stats: GovernanceStats,
    /// SNS governance cansiter
    pub sns_governance_canister: Principal,
    /// SNS ledger canister
    pub sns_ledger_canister: Principal,
    /// Super Stats canister that provides ledger stats
    pub super_stats_canister: Principal,
    /// Information about governance neurons sync
    pub sync_info: SyncInfo,
    /// Stores the mapping of each principal to its neurons
    pub principal_neurons: BTreeMap<Principal, Vec<NeuronId>>,
    /// Stores governance stats by principal
    pub principal_gov_stats: BTreeMap<Principal, GovernanceStats>,
    /// Balance list containing all principals, with their governance and
    /// ledger balances, updated every 1hr
    pub balance_list: BTreeMap<Principal, PrincipalBalance>,
    /// Token supply data, such as total supply and circulating supply
    pub supply_data: TokenSupplyData,
    /// The list of all principals from ledger and governance, including their stats
    pub wallets_list: Vec<(Account, WalletOverview)>,
    /// Same thing as above, but we now merge all subaccounts stats of a principal
    /// under the same principal item in the Map
    pub merged_wallets_list: Vec<(Account, WalletOverview)>,
}

#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct GovernanceStats {
    pub total_staked: Nat,
    pub total_locked: Nat,
    pub total_unlocked: Nat,
    pub total_rewards: Nat,
}
impl Add for GovernanceStats {
    type Output = GovernanceStats;

    fn add(self, other: Self) -> Self::Output {
        GovernanceStats {
            total_staked: self.total_staked + other.total_staked,
            total_locked: self.total_locked + other.total_locked,
            total_unlocked: self.total_unlocked + other.total_unlocked,
            total_rewards: self.total_rewards + other.total_rewards,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct PrincipalBalance {
    pub governance: GovernanceStats,
    pub ledger: u64,
}
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct TokenSupplyData {
    pub total_supply: Nat,
    pub circulating_supply: Nat,
}
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct WalletOverview {
    pub ledger: LedgerOverview,
    pub governance: GovernanceStats,
    pub total: u64,
}

impl Data {
    pub fn new(
        ogy_new_ledger: CanisterId,
        sns_governance_canister_id: CanisterId,
        super_stats_canister_id: CanisterId
    ) -> Self {
        Self {
            // TODO: Replace the canister id with the onew from args
            // super_stats_canister: super_stats_canister_id,
            // sns_governance_canister: sns_governance_canister_id,

            sns_governance_canister: SNS_GOVERNANCE_CANISTER_ID,
            sns_ledger_canister: SNS_LEDGER_CANISTER_ID,
            super_stats_canister: SUPER_STATS_CANISTER_ID,

            authorized_principals: vec![SNS_GOVERNANCE_CANISTER_ID],
            principal_neurons: BTreeMap::new(),
            principal_gov_stats: BTreeMap::new(),
            wallets_list: Vec::new(),
            merged_wallets_list: Vec::new(),
            balance_list: BTreeMap::new(),
            all_gov_stats: GovernanceStats::default(),
            supply_data: TokenSupplyData::default(),
            sync_info: SyncInfo::default(),
        }
    }
}
