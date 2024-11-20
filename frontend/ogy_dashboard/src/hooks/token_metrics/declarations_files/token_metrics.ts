import type { Principal } from "@dfinity/principal";
export interface Account {
  owner: Principal;
  subaccount: [] | [Array<number>];
}
export interface ActiveUsers {
  active_principals_count: bigint;
  active_accounts_count: bigint;
}
export interface GetHoldersArgs {
  offset: bigint;
  limit: bigint;
  merge_accounts_to_principals: boolean;
}
export interface GetHoldersResponse {
  current_offset: bigint;
  data: Array<[Account, WalletOverview]>;
  limit: bigint;
  total_count: bigint;
}
export interface GetVotingParticipationHistoryArgs {
  days: bigint;
}
export interface GetVotingPowerRatioHistory {
  days: bigint;
}
export interface GovernanceStats {
  total_rewards: bigint;
  total_staked: bigint;
  total_locked: bigint;
  total_unlocked: bigint;
}
export interface HistoryData {
  balance: bigint;
}
export interface InitArgs {
  test_mode: boolean;
  foundation_accounts: Array<string>;
  treasury_account: string;
  sns_rewards_canister_id: Principal;
  ogy_new_ledger_canister_id: Principal;
  super_stats_canister_id: Principal;
  sns_governance_canister_id: Principal;
}
export interface LockedNeuronsAmount {
  one_year: bigint;
  two_years: bigint;
  three_years: bigint;
  four_years: bigint;
  five_years: bigint;
}
export interface Overview {
  balance: bigint;
  sent: [number, bigint];
  last_active: bigint;
  first_active: bigint;
  received: [number, bigint];
  max_balance: bigint;
}
export interface ProposalsMetrics {
  daily_voting_rewards: bigint;
  reward_base_current_year: bigint;
  average_voting_participation: bigint;
  average_voting_power: bigint;
  total_voting_power: bigint;
  total_proposals: bigint;
}
export interface TokenSupplyData {
  circulating_supply: bigint;
  total_supply: bigint;
}
export interface WalletOverview {
  total: bigint;
  ledger: Overview;
  governance: GovernanceStats;
}

export type VotingParticipationHistory = Array<[bigint, number]>;
export default interface _SERVICE {
  get_active_users_count: () => Promise<ActiveUsers>;
  get_all_neuron_owners: () => Promise<Array<Principal>>;
  get_foundation_assets: () => Promise<Array<[string, WalletOverview]>>;
  get_holders: (arg_0: GetHoldersArgs) => Promise<GetHoldersResponse>;
  get_locked_neurons_period: () => Promise<LockedNeuronsAmount>;
  get_neurons_stats: (arg_0: [] | [Principal]) => Promise<GovernanceStats>;
  get_proposals_metrics: () => Promise<ProposalsMetrics>;
  get_stake_history: (arg_0: bigint) => Promise<Array<[bigint, HistoryData]>>;
  get_supply_data: () => Promise<TokenSupplyData>;
  get_voting_participation_history: (
    arg_0: GetVotingParticipationHistoryArgs
  ) => Promise<Array<[bigint, bigint]>>;
  get_voting_power_ratio_history: (
    arg_0: GetVotingPowerRatioHistory
  ) => Promise<Array<[bigint, bigint]>>;
}
