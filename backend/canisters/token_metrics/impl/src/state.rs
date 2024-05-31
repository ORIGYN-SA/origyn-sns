use candid::{ CandidType, Principal };
use canister_state_macros::canister_state;
use icrc_ledger_types::icrc1::account::Account;
use serde::{ Deserialize, Serialize };
use sns_governance_canister::types::NeuronId;
use super_stats_v3_api::account_tree::HistoryData;
use token_metrics_api::token_data::{
    GovernanceStats,
    PrincipalBalance,
    TokenSupplyData,
    WalletOverview,
};
use std::collections::BTreeMap;
use types::{ CanisterId, TimestampMillis };
use utils::{ env::{ CanisterEnv, Environment }, memory::MemorySize };

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
    /// The account that holds the treasury
    pub treasury_account: String,
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
    /// Staking history for governance
    pub gov_stake_history: Vec<(u64, HistoryData)>,
    /// These accounts hold the tokens in hand of foundation, passed as init args
    pub foundation_accounts: Vec<String>,
    /// Holds the total value of tokens in hand of foundation
    pub foundation_accounts_data: Vec<(String, WalletOverview)>,
}

impl Data {
    pub fn new(
        ogy_new_ledger: CanisterId,
        sns_governance_canister_id: CanisterId,
        super_stats_canister_id: CanisterId,
        treasury_account: String,
        foundation_accounts: Vec<String>
    ) -> Self {
        Self {
            super_stats_canister: super_stats_canister_id,
            sns_governance_canister: sns_governance_canister_id,
            sns_ledger_canister: ogy_new_ledger,
            treasury_account,
            foundation_accounts,
            foundation_accounts_data: Vec::new(),
            authorized_principals: vec![sns_governance_canister_id],
            principal_neurons: BTreeMap::new(),
            principal_gov_stats: BTreeMap::new(),
            wallets_list: Vec::new(),
            merged_wallets_list: Vec::new(),
            balance_list: BTreeMap::new(),
            all_gov_stats: GovernanceStats::default(),
            supply_data: TokenSupplyData::default(),
            sync_info: SyncInfo::default(),
            gov_stake_history: Vec::new(),
        }
    }

    pub fn update_foundation_accounts_data(&mut self) {
        let mut temp_foundation_accounts_data: Vec<(String, WalletOverview)> = Vec::new();

        for (account, wallet_overview) in &self.wallets_list {
            if self.foundation_accounts.contains(&account.to_string()) {
                temp_foundation_accounts_data.push((account.to_string(), wallet_overview.clone()));
            }
        }

        self.foundation_accounts_data = temp_foundation_accounts_data;
    }
}
