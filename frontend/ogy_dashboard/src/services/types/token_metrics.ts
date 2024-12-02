import type { Principal } from '@dfinity/principal'
import type { ActorMethod } from '@dfinity/agent'
import type { IDL } from '@dfinity/candid'

export interface Account {
  owner: Principal
  subaccount: [] | [Uint8Array | number[]]
}
export interface ActiveUsers {
  active_principals_count: bigint
  active_accounts_count: bigint
}
export interface GetHoldersArgs {
  offset: bigint
  limit: bigint
  merge_accounts_to_principals: boolean
}
export interface GetHoldersResponse {
  current_offset: bigint
  data: Array<[Account, WalletOverview]>
  limit: bigint
  total_count: bigint
}
export interface GetVotingParticipationHistoryArgs {
  days: bigint
}
export interface GetVotingPowerRatioHistory {
  days: bigint
}
export interface GovernanceStats {
  total_rewards: bigint
  total_staked: bigint
  total_locked: bigint
  total_unlocked: bigint
}
export interface HistoryData {
  balance: bigint
}
export interface InitArgs {
  test_mode: boolean
  foundation_accounts: Array<string>
  treasury_account: string
  sns_rewards_canister_id: Principal
  ogy_new_ledger_canister_id: Principal
  super_stats_canister_id: Principal
  sns_governance_canister_id: Principal
}
export interface LockedNeuronsAmount {
  one_year: bigint
  two_years: bigint
  three_years: bigint
  four_years: bigint
  five_years: bigint
}
export interface LockedNeuronsPeriodResponse {
  count: LockedNeuronsAmount
  amount: LockedNeuronsAmount
}
export interface Overview {
  balance: bigint
  sent: [number, bigint]
  last_active: bigint
  first_active: bigint
  received: [number, bigint]
  max_balance: bigint
}
export interface ProposalsMetrics {
  daily_voting_rewards: bigint
  reward_base_current_year: bigint
  average_voting_participation: bigint
  average_voting_power: bigint
  total_voting_power: bigint
  total_proposals: bigint
}
export interface TokenSupplyData {
  circulating_supply: bigint
  total_supply: bigint
}
export interface WalletOverview {
  total: bigint
  ledger: Overview
  governance: GovernanceStats
}
export interface _SERVICE {
  get_active_users_count: ActorMethod<[], ActiveUsers>
  get_all_neuron_owners: ActorMethod<[], Array<Principal>>
  get_foundation_assets: ActorMethod<[], Array<[string, WalletOverview]>>
  get_holders: ActorMethod<[GetHoldersArgs], GetHoldersResponse>
  get_locked_neurons_period: ActorMethod<[], LockedNeuronsPeriodResponse>
  get_neurons_stats: ActorMethod<[[] | [Principal]], GovernanceStats>
  get_proposals_metrics: ActorMethod<[], ProposalsMetrics>
  get_stake_history: ActorMethod<[bigint], Array<[bigint, HistoryData]>>
  get_supply_data: ActorMethod<[], TokenSupplyData>
  get_voting_participation_history: ActorMethod<
    [GetVotingParticipationHistoryArgs],
    Array<[bigint, bigint]>
  >
  get_voting_power_ratio_history: ActorMethod<
    [GetVotingPowerRatioHistory],
    Array<[bigint, bigint]>
  >
}
export declare const idlFactory: IDL.InterfaceFactory
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[]
