export interface ActivitySnapshot {
  principals_active_during_snapshot: bigint;
  accounts_active_during_snapshot: bigint;
  total_unique_accounts: bigint;
  end_time: bigint;
  start_time: bigint;
  total_unique_principals: bigint;
}
export interface GetAccountHistoryArgs {
  days: bigint;
  account: string;
}
export interface GetHoldersArgs {
  offset: bigint;
  limit: bigint;
}
export interface HistoryData {
  balance: bigint;
}
export interface HolderBalanceResponse {
  data: Overview;
  holder: string;
}
export type IndexerType =
  | { DfinityIcrc2: null }
  | { DfinityIcrc3: null }
  | { DfinityIcp: null };
export interface InitArgs {
  admin: string;
  test_mode: boolean;
}
export interface InitLedgerArgs {
  index_type: IndexerType;
  target: TargetArgs;
}
export interface LogEntry {
  text: string;
  timestamp: string;
}
export interface MemoryData {
  memory: bigint;
  heap_memory: bigint;
}
export interface Metrics {
  total_errors: bigint;
  total_api_requests: bigint;
}
export interface Overview {
  balance: bigint;
  sent: [number, bigint];
  last_active: bigint;
  first_active: bigint;
  received: [number, bigint];
  max_balance: bigint;
}
export interface ProcessedTX {
  hash: string;
  to_account: string;
  tx_value: bigint;
  from_account: string;
  block: bigint;
  tx_fee: [] | [bigint];
  tx_time: bigint;
  tx_type: string;
  spender: [] | [string];
}
export interface TargetArgs {
  daily_size: number;
  target_ledger: string;
  hourly_size: number;
}
export interface TimeChunkStats {
  mint_count: bigint;
  transfer_count: bigint;
  end_time: bigint;
  start_time: bigint;
  burn_count: bigint;
  approve_count: bigint;
  total_count: bigint;
}
export interface TimeStats {
  top_transfers: Array<ProcessedTX>;
  total_unique_accounts: bigint;
  top_burns: Array<ProcessedTX>;
  mint_stats: TotCntAvg;
  total_transaction_average: number;
  most_active_principals: Array<[string, bigint]>;
  transfer_stats: TotCntAvg;
  top_mints: Array<ProcessedTX>;
  total_transaction_value: bigint;
  most_active_accounts: Array<[string, bigint]>;
  count_over_time: Array<TimeChunkStats>;
  total_transaction_count: bigint;
  total_unique_principals: bigint;
  burn_stats: TotCntAvg;
  approve_stats: TotCntAvg;
}
export interface TotCntAvg {
  count: bigint;
  average: number;
  total_value: bigint;
}
export interface TotalHolderResponse {
  total_accounts: bigint;
  total_principals: bigint;
}
export interface WorkingStats {
  metrics: Metrics;
  next_block: bigint;
  last_update_time: bigint;
  ledger_tip_of_chain: bigint;
  timer_active: boolean;
  is_upto_date: boolean;
  directory_count: bigint;
  is_busy: boolean;
}
export default interface _SERVICE {
  add_admin: (arg_0: string) => Promise<string>;
  add_authorised: (arg_0: string) => Promise<string>;
  deposit_cycles: () => Promise<undefined>;
  get_account_history: (
    arg_0: GetAccountHistoryArgs
  ) => Promise<Array<[bigint, HistoryData]>>;
  get_account_holders: (
    arg_0: GetHoldersArgs
  ) => Promise<Array<HolderBalanceResponse>>;
  get_account_overview: (arg_0: string) => Promise<[] | [Overview]>;
  get_activity_stats: (arg_0: bigint) => Promise<Array<ActivitySnapshot>>;
  get_all_admins: () => Promise<Array<string>>;
  get_all_authorised: () => Promise<Array<string>>;
  get_canister_version: () => Promise<string>;
  get_cycles_balance: () => Promise<bigint>;
  get_daily_stats: () => Promise<TimeStats>;
  get_hourly_stats: () => Promise<TimeStats>;
  get_logs: () => Promise<[] | [Array<LogEntry>]>;
  get_memory_stats: () => Promise<MemoryData>;
  get_principal_history: (
    arg_0: GetAccountHistoryArgs
  ) => Promise<Array<[bigint, HistoryData]>>;
  get_principal_holders: (
    arg_0: GetHoldersArgs
  ) => Promise<Array<HolderBalanceResponse>>;
  get_principal_overview: (arg_0: string) => Promise<[] | [Overview]>;
  get_top_account_holders: (
    arg_0: bigint
  ) => Promise<Array<HolderBalanceResponse>>;
  get_top_principal_holders: (
    arg_0: bigint
  ) => Promise<Array<HolderBalanceResponse>>;
  get_total_holders: () => Promise<TotalHolderResponse>;
  get_working_stats: () => Promise<WorkingStats>;
  init_target_ledger: (arg_0: InitLedgerArgs) => Promise<string>;
  remove_admin: (arg_0: string) => Promise<string>;
  remove_authorised: (arg_0: string) => Promise<string>;
  self_call: () => Promise<undefined>;
  self_call2: () => Promise<undefined>;
  start_processing_timer: (arg_0: bigint) => Promise<string>;
  stop_all_timers: () => Promise<string>;
}
