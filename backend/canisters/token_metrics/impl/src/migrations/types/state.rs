use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use serde::{ Deserialize, Serialize };
use sns_governance_canister::types::NeuronId;
use super_stats_v3_api::account_tree::HistoryData;
use std::collections::BTreeMap;
use utils::env::CanisterEnv;

use token_metrics_api::token_data::ActiveUsers;
use token_metrics_api::token_data::DailyVotingMetrics;
use token_metrics_api::token_data::GovernanceStats;
use token_metrics_api::token_data::LockedNeuronsAmount;
use token_metrics_api::token_data::PrincipalBalance;
use token_metrics_api::token_data::ProposalsMetrics;
use token_metrics_api::token_data::ProposalsMetricsCalculations;
use token_metrics_api::token_data::TokenSupplyData;
use token_metrics_api::token_data::VotingHistoryCalculations;
use token_metrics_api::token_data::WalletOverview;

use crate::state::SyncInfo;

#[derive(Serialize, Deserialize)]
pub struct RuntimeStateV0 {
    /// Runtime environment
    pub env: CanisterEnv,
    /// Runtime data
    pub data: Data,
}

#[derive(Serialize, Deserialize)]
pub struct Data {
    pub authorized_principals: Vec<Principal>,
    pub all_gov_stats: GovernanceStats,
    pub sns_governance_canister: Principal,
    pub sns_ledger_canister: Principal,
    pub sns_rewards_canister: Principal,
    pub super_stats_canister: Principal,
    pub treasury_account: String,
    pub sync_info: SyncInfo,
    pub principal_neurons: BTreeMap<Principal, Vec<NeuronId>>,
    pub principal_gov_stats: BTreeMap<Principal, GovernanceStats>,
    pub balance_list: BTreeMap<Principal, PrincipalBalance>,
    pub supply_data: TokenSupplyData,
    pub wallets_list: Vec<(Account, WalletOverview)>,
    pub merged_wallets_list: Vec<(Account, WalletOverview)>,
    pub gov_stake_history: Vec<(u64, HistoryData)>,
    pub foundation_accounts: Vec<String>,
    pub foundation_accounts_data: Vec<(String, WalletOverview)>,
    pub locked_neurons_amount: LockedNeuronsAmount,
    pub porposals_metrics: ProposalsMetrics,
    pub proposals_metrics_calculations: ProposalsMetricsCalculations,
    pub daily_voting_metrics: BTreeMap<u64, DailyVotingMetrics>,
    pub voting_participation_history: BTreeMap<u64, u64>,
    pub voting_participation_history_calculations: BTreeMap<u64, VotingHistoryCalculations>,
    pub voting_power_ratio_history: Vec<(u64, u64)>,
    pub active_users: ActiveUsers,
}
