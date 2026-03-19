use std::cell::RefCell;
use std::collections::BTreeMap;

use bity_ic_canister_state_macros::canister_state;
use candid::{CandidType, Principal};
use ic_stable_structures::{StableBTreeMap, StableVec};
use icrc_ledger_types::icrc1::account::Account;
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::{NeuronId, ProposalId};
use token_metrics_api::token_data::{
    ActiveUsers, DailyVotingMetrics, GovernanceStats, LockedNeuronsAmount, ProposalsMetrics,
    ProposalsMetricsCalculations, TokenSupplyData, VotingHistoryCalculations, WalletOverview,
};
use token_metrics_api::types::ledger_indexer::{
    AccountDayKey, ActivitySnapshot, HistoryBalanceCache, HistoryData, LedgerAccount,
    LedgerIndexerData, Overview, ProcessedTX,
};
use types::{CanisterId, TimestampMillis};
use utils::{
    env::{CanisterEnv, Environment},
    memory::MemorySize,
};

use crate::memory::{self, VM};

canister_state!(RuntimeState);

// Stable memory maps

thread_local! {
    // Memory region 1: Account overviews (LedgerAccount → Overview)
    static ACCOUNT_OVERVIEWS: RefCell<StableBTreeMap<LedgerAccount, Overview, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::ACCOUNT_OVERVIEWS))
    );
    // Memory region 2: Account history (AccountDayKey → HistoryData)
    static ACCOUNT_HISTORY: RefCell<StableBTreeMap<AccountDayKey, HistoryData, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::ACCOUNT_HISTORY))
    );
    // Memory region 3: Account history balance cache (LedgerAccount → HistoryBalanceCache)
    static ACCOUNT_HISTORY_CACHE: RefCell<StableBTreeMap<LedgerAccount, HistoryBalanceCache, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::ACCOUNT_HISTORY_CACHE))
    );
    // Memory region 9: Activity snapshots (daily activity records)
    static ACTIVITY_SNAPSHOTS: RefCell<StableVec<ActivitySnapshot, VM>> = RefCell::new(
        StableVec::init(memory::get_memory(memory::ACTIVITY_SNAPSHOTS))
    );
    // Memory region 10: Transaction cache (block_number → ProcessedTX)
    static TRANSACTION_CACHE: RefCell<StableBTreeMap<u64, ProcessedTX, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::TRANSACTION_CACHE))
    );
    // Memory region 11: Wallets list — all accounts with ledger + governance overview
    static WALLETS_LIST: RefCell<StableBTreeMap<LedgerAccount, WalletOverview, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::WALLETS_LIST))
    );
    // Memory region 12: Merged wallets list — subaccounts merged by principal
    static MERGED_WALLETS_LIST: RefCell<StableBTreeMap<LedgerAccount, WalletOverview, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::MERGED_WALLETS_LIST))
    );
    // Memory region 13: Governance stake history (day → HistoryData)
    static GOV_STAKE_HISTORY: RefCell<StableBTreeMap<u64, HistoryData, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::GOV_STAKE_HISTORY))
    );
    // Memory region 14: Voting power ratio history (day → ratio)
    static VOTING_POWER_RATIO: RefCell<StableBTreeMap<u64, u64, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::VOTING_POWER_RATIO))
    );
}

// --- Account Overviews ---
pub fn with_overviews<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<LedgerAccount, Overview, VM>) -> R,
{
    ACCOUNT_OVERVIEWS.with(|m| f(&m.borrow()))
}

pub fn with_overviews_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<LedgerAccount, Overview, VM>) -> R,
{
    ACCOUNT_OVERVIEWS.with(|m| f(&mut m.borrow_mut()))
}

// --- Account History ---
pub fn with_history<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<AccountDayKey, HistoryData, VM>) -> R,
{
    ACCOUNT_HISTORY.with(|m| f(&m.borrow()))
}

pub fn with_history_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<AccountDayKey, HistoryData, VM>) -> R,
{
    ACCOUNT_HISTORY.with(|m| f(&mut m.borrow_mut()))
}

// --- Account History Cache ---
pub fn with_history_cache<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<LedgerAccount, HistoryBalanceCache, VM>) -> R,
{
    ACCOUNT_HISTORY_CACHE.with(|m| f(&m.borrow()))
}

pub fn with_history_cache_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<LedgerAccount, HistoryBalanceCache, VM>) -> R,
{
    ACCOUNT_HISTORY_CACHE.with(|m| f(&mut m.borrow_mut()))
}

// --- Activity Snapshots ---
pub fn with_activity_snapshots<F, R>(f: F) -> R
where
    F: FnOnce(&StableVec<ActivitySnapshot, VM>) -> R,
{
    ACTIVITY_SNAPSHOTS.with(|m| f(&m.borrow()))
}

pub fn with_activity_snapshots_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableVec<ActivitySnapshot, VM>) -> R,
{
    ACTIVITY_SNAPSHOTS.with(|m| f(&mut m.borrow_mut()))
}

// --- Transaction Cache ---
pub fn with_transaction_cache<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, ProcessedTX, VM>) -> R,
{
    TRANSACTION_CACHE.with(|m| f(&m.borrow()))
}

pub fn with_transaction_cache_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, ProcessedTX, VM>) -> R,
{
    TRANSACTION_CACHE.with(|m| f(&mut m.borrow_mut()))
}

// --- Wallets List ---
pub fn with_wallets_list<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<LedgerAccount, WalletOverview, VM>) -> R,
{
    WALLETS_LIST.with(|m| f(&m.borrow()))
}

pub fn with_wallets_list_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<LedgerAccount, WalletOverview, VM>) -> R,
{
    WALLETS_LIST.with(|m| f(&mut m.borrow_mut()))
}

// --- Merged Wallets List ---
pub fn with_merged_wallets_list<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<LedgerAccount, WalletOverview, VM>) -> R,
{
    MERGED_WALLETS_LIST.with(|m| f(&m.borrow()))
}

pub fn with_merged_wallets_list_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<LedgerAccount, WalletOverview, VM>) -> R,
{
    MERGED_WALLETS_LIST.with(|m| f(&mut m.borrow_mut()))
}

// --- Governance Stake History ---
pub fn with_gov_stake_history<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, HistoryData, VM>) -> R,
{
    GOV_STAKE_HISTORY.with(|m| f(&m.borrow()))
}

pub fn with_gov_stake_history_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, HistoryData, VM>) -> R,
{
    GOV_STAKE_HISTORY.with(|m| f(&mut m.borrow_mut()))
}

// --- Voting Power Ratio History ---
pub fn with_voting_power_ratio<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, u64, VM>) -> R,
{
    VOTING_POWER_RATIO.with(|m| f(&m.borrow()))
}

pub fn with_voting_power_ratio_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, u64, VM>) -> R,
{
    VOTING_POWER_RATIO.with(|m| f(&mut m.borrow_mut()))
}

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
                cycles_balance_in_tc: self.env.cycles_balance_in_tc() as f64,
            },
            sync_info: self.data.sync_info.clone(),
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

#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct SyncInfo {
    pub last_synced_start: TimestampMillis,
    pub last_synced_end: TimestampMillis,
    pub last_synced_number_of_neurons: usize,
    pub last_synced_transaction: usize,
    pub last_synced_number_of_proposals: usize,
    pub last_synced_proposal_id: Option<ProposalId>,
    pub ongoing_proposals: Vec<ProposalId>,
}
#[derive(Serialize, Deserialize)]
pub struct Data {
    /// authorized Principals for guarded calls
    pub authorized_principals: Vec<Principal>,
    /// All stats about governance, total staked, unlocked, locked and rewards
    pub all_gov_stats: GovernanceStats,
    /// SNS governance canister
    pub sns_governance_canister: Principal,
    /// SNS ledger canister
    pub sns_ledger_canister: Principal,
    /// SNS Rewards canister that distributes rewards
    pub sns_rewards_canister: Principal,
    /// The account that holds the treasury
    pub treasury_account: String,
    /// Information about governance neurons sync
    pub sync_info: SyncInfo,
    /// Stores the mapping of each principal to its neurons
    pub principal_neurons: BTreeMap<Principal, Vec<NeuronId>>,
    /// Stores governance stats by principal
    pub principal_gov_stats: BTreeMap<Principal, GovernanceStats>,
    /// Token supply data, such as total supply and circulating supply
    pub supply_data: TokenSupplyData,
    /// These accounts hold the tokens in hand of foundation, passed as init args
    pub foundation_accounts: Vec<String>,
    /// Holds the total value of tokens in hand of foundation
    pub foundation_accounts_data: Vec<(String, WalletOverview)>,
    /// Amount of locked tokens and their period
    pub locked_neurons_amount: LockedNeuronsAmount,
    /// Amount of locked tokens and their period
    pub locked_neurons_unique_owners: LockedNeuronsAmount,
    /// Proposals metrics, such as total, avg voting power and participation
    pub proposals_metrics: ProposalsMetrics,
    /// Used to calculate proposals_metrics
    pub proposals_metrics_calculations: ProposalsMetricsCalculations,
    /// Daily metrics for org voting power / total voting power and voting participation
    pub daily_voting_metrics: BTreeMap<u64, DailyVotingMetrics>,
    /// Voting Participation History, (days, u64 as percentage)
    pub voting_participation_history: BTreeMap<u64, u64>,
    /// Used to calculate voting_participation_history
    pub voting_participation_history_calculations: BTreeMap<u64, VotingHistoryCalculations>,
    /// Active users = users with > 0 OGY in their wallet
    pub active_users: ActiveUsers,
    /// Ledger indexer config and stats (heap-resident; stable maps are separate)
    pub ledger_indexer: LedgerIndexerData,
}

impl Data {
    pub fn new(
        ogy_new_ledger: CanisterId,
        sns_governance_canister_id: CanisterId,
        sns_rewards_canister_id: CanisterId,
        treasury_account: String,
        foundation_accounts: Vec<String>,
    ) -> Self {
        Self {
            sns_governance_canister: sns_governance_canister_id,
            sns_ledger_canister: ogy_new_ledger,
            sns_rewards_canister: sns_rewards_canister_id,
            treasury_account,
            foundation_accounts,
            foundation_accounts_data: Vec::new(),
            authorized_principals: vec![sns_governance_canister_id],
            principal_neurons: BTreeMap::new(),
            principal_gov_stats: BTreeMap::new(),
            voting_participation_history: BTreeMap::new(),
            voting_participation_history_calculations: BTreeMap::new(),
            all_gov_stats: GovernanceStats::default(),
            supply_data: TokenSupplyData::default(),
            sync_info: SyncInfo::default(),
            locked_neurons_amount: LockedNeuronsAmount::default(),
            locked_neurons_unique_owners: LockedNeuronsAmount::default(),
            proposals_metrics: ProposalsMetrics::default(),
            proposals_metrics_calculations: ProposalsMetricsCalculations::default(),
            daily_voting_metrics: BTreeMap::new(),
            active_users: ActiveUsers::default(),
            ledger_indexer: LedgerIndexerData::default(),
        }
    }

    pub fn update_foundation_accounts_data(&mut self) {
        let mut temp: Vec<(String, WalletOverview)> = Vec::new();
        with_wallets_list(|m| {
            for entry in m.iter() {
                let account: Account = (*entry.key()).into();
                let text = account.to_principal_dot_account();
                if self.foundation_accounts.contains(&text) {
                    temp.push((text, entry.value()));
                }
            }
        });
        self.foundation_accounts_data = temp;
    }
}
pub trait PrincipalDotAccountFormat {
    fn to_principal_dot_account(&self) -> String;
}

impl PrincipalDotAccountFormat for Account {
    fn to_principal_dot_account(&self) -> String {
        match &self.subaccount {
            Some(subaccount) => format!("{}.{}", self.owner, hex::encode(subaccount)),
            None => format!(
                "{}.0000000000000000000000000000000000000000000000000000000000000000",
                self.owner.to_string()
            ),
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;

    #[test]
    fn test_to_principal_dot_account_with_subaccount() {
        let principal = Principal::from_text("aaaaa-aa").unwrap();
        let subaccount = Some([0u8; 32]);

        let account = Account {
            owner: principal,
            subaccount,
        };

        // aaaaa-aa.0000000000000000000000000000000000000000000000000000000000000000
        // aaaaa-aa.0000000000000000000000000000000000000000000000000000000000000000
        assert_eq!(
            account.to_principal_dot_account(),
            format!("{}.{}", principal, hex::encode([0u8; 32]))
        );
    }

    #[test]
    fn test_to_principal_dot_account_without_subaccount() {
        let principal = Principal::from_text("aaaaa-aa").unwrap();
        let account = Account {
            owner: principal,
            subaccount: None,
        };

        let expected = format!(
            "{}.0000000000000000000000000000000000000000000000000000000000000000",
            principal.to_string()
        );
        assert_eq!(account.to_principal_dot_account(), expected);
    }
}
