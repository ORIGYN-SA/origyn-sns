use token_metrics_api::token_data::LockedNeuronsAmount;

use crate::state::{ Data, RuntimeState };

use self::types::state::RuntimeStateV0;

pub mod types;

impl From<RuntimeStateV0> for RuntimeState {
    fn from(old_state: RuntimeStateV0) -> Self {
        Self {
            env: old_state.env,
            data: Data {
                authorized_principals: old_state.data.authorized_principals,
                all_gov_stats: old_state.data.all_gov_stats,
                sns_governance_canister: old_state.data.sns_governance_canister,
                sns_ledger_canister: old_state.data.sns_ledger_canister,
                sns_rewards_canister: old_state.data.sns_rewards_canister,
                super_stats_canister: old_state.data.super_stats_canister,
                treasury_account: old_state.data.treasury_account,
                sync_info: old_state.data.sync_info,
                principal_neurons: old_state.data.principal_neurons,
                principal_gov_stats: old_state.data.principal_gov_stats,
                balance_list: old_state.data.balance_list,
                supply_data: old_state.data.supply_data,
                wallets_list: old_state.data.wallets_list,
                merged_wallets_list: old_state.data.merged_wallets_list,
                gov_stake_history: old_state.data.gov_stake_history,
                foundation_accounts: old_state.data.foundation_accounts,
                foundation_accounts_data: old_state.data.foundation_accounts_data,
                locked_neurons_amount: old_state.data.locked_neurons_amount,
                locked_neurons_unique_owners: LockedNeuronsAmount::default(),
                porposals_metrics: old_state.data.porposals_metrics,
                proposals_metrics_calculations: old_state.data.proposals_metrics_calculations,
                daily_voting_metrics: old_state.data.daily_voting_metrics,
                voting_participation_history: old_state.data.voting_participation_history,
                voting_participation_history_calculations: old_state.data.voting_participation_history_calculations,
                voting_power_ratio_history: old_state.data.voting_power_ratio_history,
                active_users: old_state.data.active_users,
            },
        }
    }
}
