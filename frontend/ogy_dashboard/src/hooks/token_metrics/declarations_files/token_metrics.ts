import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

/**
 * [Account](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#value)
 * representation of ledgers supporting the ICRC-1 standard.
 */
export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
/**
 * Active user counts (users with > 0 OGY balance).
 */
export interface ActiveUsers {
  'active_principals_count' : bigint,
  'active_accounts_count' : bigint,
}
export interface ActivitySnapshot {
  'principals_active_during_snapshot' : bigint,
  'accounts_active_during_snapshot' : bigint,
  'total_unique_accounts' : bigint,
  'end_time' : bigint,
  'start_time' : bigint,
  'total_unique_principals' : bigint,
}
export type Args = { 'Upgrade' : UpgradeArgs } |
  { 'Init' : InitArgs };
/**
 * Represents a semantic version number following the MAJOR.MINOR.PATCH format.
 * 
 * # Examples
 * 
 * ```
 * use types::BuildVersion;
 * 
 * let version = BuildVersion::new(1, 2, 3);
 * assert_eq!(version.to_string(), "1.2.3");
 * 
 * let parsed = "1.2.3".parse::<BuildVersion>().unwrap();
 * assert_eq!(version, parsed);
 * ```
 */
export interface BuildVersion {
  /**
   * Major version number, incremented for incompatible API changes
   */
  'major' : number,
  /**
   * Minor version number, incremented for backwards-compatible functionality additions
   */
  'minor' : number,
  /**
   * Patch version number, incremented for backwards-compatible bug fixes
   */
  'patch' : number,
}
export interface GetAccountHistoryArgs { 'days' : bigint, 'account' : string }
export interface GetAccountHoldersArgs { 'offset' : bigint, 'limit' : bigint }
export interface GetHoldersArgs {
  'offset' : bigint,
  'limit' : bigint,
  'merge_accounts_to_principals' : boolean,
}
export interface GetHoldersResponse {
  'current_offset' : bigint,
  'data' : Array<[Account, WalletOverviewResponse]>,
  'limit' : bigint,
  'total_count' : bigint,
}
export interface GetVotingParticipationHistoryArgs { 'days' : bigint }
export interface GetVotingPowerRatioHistory { 'days' : bigint }
/**
 * Aggregate governance statistics for a principal or the whole canister.
 * All token amounts are in e8s (1 OGY = 10^8 e8s).
 */
export interface GovernanceStats {
  /**
   * Accumulated rewards (staked maturity)
   */
  'total_rewards' : bigint,
  /**
   * Total tokens staked (locked + unlocked + restaked maturity)
   */
  'total_staked' : bigint,
  /**
   * Tokens in locked neurons (non-zero dissolve delay)
   */
  'total_locked' : bigint,
  /**
   * Tokens in unlocked neurons (zero dissolve delay or past dissolve timestamp)
   */
  'total_unlocked' : bigint,
}
export interface HistoryData { 'balance' : bigint }
/**
 * Candid-facing HolderBalanceResponse wrapping OverviewResponse.
 */
export interface HolderBalanceResponseCompat {
  'data' : OverviewResponse,
  'holder' : string,
}
export interface InitArgs {
  'test_mode' : boolean,
  'foundation_accounts' : Array<string>,
  'treasury_account' : string,
  'authorized_principals' : Array<Principal>,
  'version' : BuildVersion,
  'sns_rewards_canister_id' : Principal,
  'ogy_new_ledger_canister_id' : Principal,
  'commit_hash' : string,
  'sns_governance_canister_id' : Principal,
}
/**
 * Candid-facing LockedNeuronsAmount with u64 fields to match frontend IDL.
 */
export interface LockedNeuronsAmountResponse {
  'one_year' : bigint,
  'two_years' : bigint,
  'three_years' : bigint,
  'four_years' : bigint,
  'five_years' : bigint,
}
export interface LockedNeuronsPeriodResponse {
  'count' : LockedNeuronsAmountResponse,
  'amount' : LockedNeuronsAmountResponse,
}
/**
 * Represents a single log entry with timestamp and message.
 * 
 * This struct is used to store individual log messages with their
 * associated timestamps.
 */
export interface LogEntry {
  /**
   * The log message content
   */
  'message' : string,
  /**
   * The timestamp when the log entry was created (in milliseconds)
   */
  'timestamp' : bigint,
}
/**
 * Stub metrics for WorkingStats (frontend super_stats IDL expects this field).
 */
export interface Metrics {
  'total_errors' : bigint,
  'total_api_requests' : bigint,
}
/**
 * Candid-facing Overview with `sent`/`received` as tuples to match frontend IDL.
 */
export interface OverviewResponse {
  'balance' : bigint,
  'sent' : [number, bigint],
  'last_active' : bigint,
  'first_active' : bigint,
  'received' : [number, bigint],
  'max_balance' : bigint,
}
export interface ProcessedTX {
  'hash' : string,
  'to_account' : string,
  'tx_value' : bigint,
  'from_account' : string,
  'block' : bigint,
  'tx_fee' : [] | [bigint],
  'tx_time' : bigint,
  'tx_type' : string,
  'spender' : [] | [string],
}
/**
 * Candid-facing ProposalsMetrics with all u64 fields to match frontend IDL.
 */
export interface ProposalsMetricsResponse {
  'daily_voting_rewards' : bigint,
  'reward_base_current_year' : bigint,
  'average_voting_participation' : bigint,
  'average_voting_power' : bigint,
  'total_voting_power' : bigint,
  'total_proposals' : bigint,
}
export interface TimeChunkStats {
  'mint_count' : bigint,
  'transfer_count' : bigint,
  'end_time' : bigint,
  'start_time' : bigint,
  'burn_count' : bigint,
  'approve_count' : bigint,
  'total_count' : bigint,
}
export interface TimeStats {
  'top_transfers' : Array<ProcessedTX>,
  'total_unique_accounts' : bigint,
  'top_burns' : Array<ProcessedTX>,
  'mint_stats' : TotCntAvg,
  'total_transaction_average' : number,
  'most_active_principals' : Array<[string, bigint]>,
  'transfer_stats' : TotCntAvg,
  'top_mints' : Array<ProcessedTX>,
  'total_transaction_value' : bigint,
  'most_active_accounts' : Array<[string, bigint]>,
  'count_over_time' : Array<TimeChunkStats>,
  'total_transaction_count' : bigint,
  'total_unique_principals' : bigint,
  'burn_stats' : TotCntAvg,
  'approve_stats' : TotCntAvg,
}
/**
 * Token supply data from the ledger (total and circulating).
 */
export interface TokenSupplyData {
  'circulating_supply' : bigint,
  'total_supply' : bigint,
}
export interface TotCntAvg {
  'count' : bigint,
  'average' : number,
  'total_value' : bigint,
}
export interface TotalHolderResponse {
  'total_accounts' : bigint,
  'total_principals' : bigint,
}
export interface UpgradeArgs {
  'version' : BuildVersion,
  'commit_hash' : string,
}
/**
 * Candid-facing WalletOverview with `total` as u64 to match frontend IDL.
 */
export interface WalletOverviewResponse {
  'total' : bigint,
  'ledger' : OverviewResponse,
  'governance' : GovernanceStats,
}
/**
 * Candid-facing WorkingStats with `metrics` field to match frontend super_stats IDL.
 */
export interface WorkingStatsResponse {
  'metrics' : Metrics,
  'next_block' : bigint,
  'last_update_time' : bigint,
  'ledger_tip_of_chain' : bigint,
  'timer_active' : boolean,
  'is_upto_date' : boolean,
  'directory_count' : bigint,
  'is_busy' : boolean,
}
export interface _SERVICE {
  'get_account_history' : ActorMethod<
    [GetAccountHistoryArgs],
    Array<[bigint, HistoryData]>
  >,
  'get_account_holders' : ActorMethod<
    [GetAccountHoldersArgs],
    Array<HolderBalanceResponseCompat>
  >,
  'get_account_overview' : ActorMethod<[string], [] | [OverviewResponse]>,
  'get_active_users_count' : ActorMethod<[], ActiveUsers>,
  'get_activity_stats' : ActorMethod<[bigint], Array<ActivitySnapshot>>,
  'get_all_neuron_owners' : ActorMethod<[], Array<Principal>>,
  'get_daily_stats' : ActorMethod<[], TimeStats>,
  'get_foundation_assets' : ActorMethod<
    [],
    Array<[string, WalletOverviewResponse]>
  >,
  'get_holders' : ActorMethod<[GetHoldersArgs], GetHoldersResponse>,
  'get_hourly_stats' : ActorMethod<[], TimeStats>,
  'get_locked_neurons_period' : ActorMethod<[], LockedNeuronsPeriodResponse>,
  'get_logs' : ActorMethod<[], Array<LogEntry>>,
  'get_neurons_stats' : ActorMethod<[[] | [Principal]], GovernanceStats>,
  'get_principal_history' : ActorMethod<
    [GetAccountHistoryArgs],
    Array<[bigint, HistoryData]>
  >,
  'get_principal_holders' : ActorMethod<
    [GetAccountHoldersArgs],
    Array<HolderBalanceResponseCompat>
  >,
  'get_principal_overview' : ActorMethod<[string], [] | [OverviewResponse]>,
  'get_proposals_metrics' : ActorMethod<[], ProposalsMetricsResponse>,
  'get_stake_history' : ActorMethod<[bigint], Array<[bigint, HistoryData]>>,
  'get_supply_data' : ActorMethod<[], TokenSupplyData>,
  'get_top_account_holders' : ActorMethod<
    [bigint],
    Array<HolderBalanceResponseCompat>
  >,
  'get_top_principal_holders' : ActorMethod<
    [bigint],
    Array<HolderBalanceResponseCompat>
  >,
  'get_total_holders' : ActorMethod<[], TotalHolderResponse>,
  'get_voting_participation_history' : ActorMethod<
    [GetVotingParticipationHistoryArgs],
    Array<[bigint, bigint]>
  >,
  'get_voting_power_ratio_history' : ActorMethod<
    [GetVotingPowerRatioHistory],
    Array<[bigint, bigint]>
  >,
  'get_working_stats' : ActorMethod<[], WorkingStatsResponse>,
  'start_processing_timer' : ActorMethod<[bigint], string>,
  'stop_all_timers' : ActorMethod<[], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
