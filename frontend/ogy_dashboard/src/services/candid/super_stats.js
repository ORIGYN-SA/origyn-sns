export const idlFactory = ({ IDL }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const InitArgs = IDL.Record({ admin: IDL.Text, test_mode: IDL.Bool });
  const GetAccountHistoryArgs = IDL.Record({
    days: IDL.Nat64,
    account: IDL.Text,
  });
  const HistoryData = IDL.Record({ balance: IDL.Nat });
  const AccountHistory = IDL.Vec(IDL.Tuple(IDL.Nat64, HistoryData));
  const GetHoldersArgs = IDL.Record({
    offset: IDL.Nat64,
    limit: IDL.Nat64,
  });
  const TxCount = IDL.Tuple(IDL.Nat32, IDL.Nat);
  const Overview = IDL.Record({
    balance: IDL.Nat,
    sent: TxCount,
    last_active: IDL.Nat64,
    first_active: IDL.Nat64,
    received: TxCount,
    max_balance: IDL.Nat,
  });
  const HolderBalanceResponse = IDL.Record({
    data: Overview,
    holder: IDL.Text,
  });
  const ActivitySnapshot = IDL.Record({
    principals_active_during_snapshot: IDL.Nat64,
    accounts_active_during_snapshot: IDL.Nat64,
    total_unique_accounts: IDL.Nat64,
    end_time: IDL.Nat64,
    start_time: IDL.Nat64,
    total_unique_principals: IDL.Nat64,
  });
  const ProcessedTX = IDL.Record({
    hash: IDL.Text,
    to_account: IDL.Text,
    tx_value: IDL.Nat,
    from_account: IDL.Text,
    block: IDL.Nat64,
    tx_fee: IDL.Opt(IDL.Nat),
    tx_time: IDL.Nat64,
    tx_type: IDL.Text,
    spender: IDL.Opt(IDL.Text),
  });
  const TotCntAvg = IDL.Record({
    count: IDL.Nat,
    average: IDL.Float64,
    total_value: IDL.Nat,
  });
  const ActiveAccount = IDL.Tuple(IDL.Text, IDL.Nat64);
  const TimeChunkStats = IDL.Record({
    mint_count: IDL.Nat64,
    transfer_count: IDL.Nat64,
    end_time: IDL.Nat64,
    start_time: IDL.Nat64,
    burn_count: IDL.Nat64,
    approve_count: IDL.Nat64,
    total_count: IDL.Nat64,
  });
  const TimeStats = IDL.Record({
    top_transfers: IDL.Vec(ProcessedTX),
    total_unique_accounts: IDL.Nat64,
    top_burns: IDL.Vec(ProcessedTX),
    mint_stats: TotCntAvg,
    total_transaction_average: IDL.Float64,
    most_active_principals: IDL.Vec(ActiveAccount),
    transfer_stats: TotCntAvg,
    top_mints: IDL.Vec(ProcessedTX),
    total_transaction_value: IDL.Nat,
    most_active_accounts: IDL.Vec(ActiveAccount),
    count_over_time: IDL.Vec(TimeChunkStats),
    total_transaction_count: IDL.Nat,
    total_unique_principals: IDL.Nat64,
    burn_stats: TotCntAvg,
    approve_stats: TotCntAvg,
  });
  const LogEntry = IDL.Record({ text: IDL.Text, timestamp: IDL.Text });
  const MemoryStats = IDL.Record({
    memory: IDL.Nat64,
    heap_memory: IDL.Nat64,
  });
  const TotalHolderResponse = IDL.Record({
    total_accounts: IDL.Nat64,
    total_principals: IDL.Nat64,
  });
  const MetricStats = IDL.Record({
    total_errors: IDL.Nat64,
    total_api_requests: IDL.Nat64,
  });
  const WorkingStats = IDL.Record({
    metrics: MetricStats,
    next_block: IDL.Nat64,
    last_update_time: IDL.Nat64,
    ledger_tip_of_chain: IDL.Nat64,
    timer_active: IDL.Bool,
    is_upto_date: IDL.Bool,
    directory_count: IDL.Nat64,
    is_busy: IDL.Bool,
  });
  const IndexerType = IDL.Variant({
    DfinityIcrc2: IDL.Null,
    DfinityIcrc3: IDL.Null,
    DfinityIcp: IDL.Null,
  });
  const SetTargetArgs = IDL.Record({
    daily_size: IDL.Nat8,
    target_ledger: IDL.Text,
    hourly_size: IDL.Nat8,
  });
  const InitLedgerArgs = IDL.Record({
    index_type: IndexerType,
    target: SetTargetArgs,
  });
  return IDL.Service({
    add_admin: IDL.Func([IDL.Text], [IDL.Text], []),
    add_authorised: IDL.Func([IDL.Text], [IDL.Text], []),
    deposit_cycles: IDL.Func([], [], []),
    get_account_history: IDL.Func(
      [GetAccountHistoryArgs],
      [AccountHistory],
      ["query"]
    ),
    get_account_holders: IDL.Func(
      [GetHoldersArgs],
      [IDL.Vec(HolderBalanceResponse)],
      ["query"]
    ),
    get_account_overview: IDL.Func([IDL.Text], [IDL.Opt(Overview)], ["query"]),
    get_activity_stats: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(ActivitySnapshot)],
      ["query"]
    ),
    get_all_admins: IDL.Func([], [IDL.Vec(IDL.Text)], ["query"]),
    get_all_authorised: IDL.Func([], [IDL.Vec(IDL.Text)], ["query"]),
    get_canister_version: IDL.Func([], [IDL.Text], ["query"]),
    get_cycles_balance: IDL.Func([], [IDL.Nat64], ["query"]),
    get_daily_stats: IDL.Func([], [TimeStats], ["query"]),
    get_hourly_stats: IDL.Func([], [TimeStats], ["query"]),
    get_logs: IDL.Func([], [IDL.Opt(IDL.Vec(LogEntry))], ["query"]),
    get_memory_stats: IDL.Func([], [MemoryStats], ["query"]),
    get_principal_history: IDL.Func(
      [GetAccountHistoryArgs],
      [AccountHistory],
      ["query"]
    ),
    get_principal_holders: IDL.Func(
      [GetHoldersArgs],
      [IDL.Vec(HolderBalanceResponse)],
      ["query"]
    ),
    get_principal_overview: IDL.Func(
      [IDL.Text],
      [IDL.Opt(Overview)],
      ["query"]
    ),
    get_top_account_holders: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(HolderBalanceResponse)],
      ["query"]
    ),
    get_top_principal_holders: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(HolderBalanceResponse)],
      ["query"]
    ),
    get_total_holders: IDL.Func([], [TotalHolderResponse], ["query"]),
    get_working_stats: IDL.Func([], [WorkingStats], ["query"]),
    init_target_ledger: IDL.Func([InitLedgerArgs], [IDL.Text], []),
    remove_admin: IDL.Func([IDL.Text], [IDL.Text], []),
    remove_authorised: IDL.Func([IDL.Text], [IDL.Text], []),
    start_processing_timer: IDL.Func([IDL.Nat64], [IDL.Text], []),
    stop_all_timers: IDL.Func([], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({ admin: IDL.Text, test_mode: IDL.Bool });
  return [InitArgs];
};
