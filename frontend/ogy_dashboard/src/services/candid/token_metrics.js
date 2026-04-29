export const idlFactory = ({ IDL }) => {
  const BuildVersion = IDL.Record({
    major: IDL.Nat32,
    minor: IDL.Nat32,
    patch: IDL.Nat32,
  });
  const UpgradeArgs = IDL.Record({
    version: BuildVersion,
    commit_hash: IDL.Text,
  });
  const InitArgs = IDL.Record({
    test_mode: IDL.Bool,
    foundation_accounts: IDL.Vec(IDL.Text),
    treasury_account: IDL.Text,
    authorized_principals: IDL.Vec(IDL.Principal),
    version: BuildVersion,
    sns_rewards_canister_id: IDL.Principal,
    ogy_new_ledger_canister_id: IDL.Principal,
    commit_hash: IDL.Text,
    sns_governance_canister_id: IDL.Principal,
  });
  const Args = IDL.Variant({ Upgrade: UpgradeArgs, Init: InitArgs });
  const GetAccountHistoryArgs = IDL.Record({
    days: IDL.Nat64,
    account: IDL.Text,
  });
  const HistoryData = IDL.Record({ balance: IDL.Nat });
  const GetAccountHoldersArgs = IDL.Record({
    offset: IDL.Nat64,
    limit: IDL.Nat64,
  });
  const OverviewResponse = IDL.Record({
    balance: IDL.Nat,
    sent: IDL.Tuple(IDL.Nat32, IDL.Nat),
    last_active: IDL.Nat64,
    first_active: IDL.Nat64,
    received: IDL.Tuple(IDL.Nat32, IDL.Nat),
    max_balance: IDL.Nat,
  });
  const HolderBalanceResponseCompat = IDL.Record({
    data: OverviewResponse,
    holder: IDL.Text,
  });
  const ActiveUsers = IDL.Record({
    active_principals_count: IDL.Nat64,
    active_accounts_count: IDL.Nat64,
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
    most_active_principals: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
    transfer_stats: TotCntAvg,
    top_mints: IDL.Vec(ProcessedTX),
    total_transaction_value: IDL.Nat,
    most_active_accounts: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
    count_over_time: IDL.Vec(TimeChunkStats),
    total_transaction_count: IDL.Nat,
    total_unique_principals: IDL.Nat64,
    burn_stats: TotCntAvg,
    approve_stats: TotCntAvg,
  });
  const GovernanceStats = IDL.Record({
    total_rewards: IDL.Nat,
    total_staked: IDL.Nat,
    total_locked: IDL.Nat,
    total_unlocked: IDL.Nat,
  });
  const WalletOverviewResponse = IDL.Record({
    total: IDL.Nat64,
    ledger: OverviewResponse,
    governance: GovernanceStats,
  });
  const GetHoldersArgs = IDL.Record({
    offset: IDL.Nat64,
    limit: IDL.Nat64,
    merge_accounts_to_principals: IDL.Bool,
  });
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const GetHoldersResponse = IDL.Record({
    current_offset: IDL.Nat64,
    data: IDL.Vec(IDL.Tuple(Account, WalletOverviewResponse)),
    limit: IDL.Nat64,
    total_count: IDL.Nat64,
  });
  const LockedNeuronsAmountResponse = IDL.Record({
    one_year: IDL.Nat64,
    two_years: IDL.Nat64,
    three_years: IDL.Nat64,
    four_years: IDL.Nat64,
    five_years: IDL.Nat64,
  });
  const LockedNeuronsPeriodResponse = IDL.Record({
    count: LockedNeuronsAmountResponse,
    amount: LockedNeuronsAmountResponse,
  });
  const LogEntry = IDL.Record({
    message: IDL.Text,
    timestamp: IDL.Nat64,
  });
  const ProposalsMetricsResponse = IDL.Record({
    daily_voting_rewards: IDL.Nat64,
    reward_base_current_year: IDL.Nat64,
    average_voting_participation: IDL.Nat64,
    average_voting_power: IDL.Nat64,
    total_voting_power: IDL.Nat64,
    total_proposals: IDL.Nat64,
  });
  const TokenSupplyData = IDL.Record({
    circulating_supply: IDL.Nat,
    total_supply: IDL.Nat,
  });
  const TotalHolderResponse = IDL.Record({
    total_accounts: IDL.Nat64,
    total_principals: IDL.Nat64,
  });
  const GetVotingParticipationHistoryArgs = IDL.Record({ days: IDL.Nat64 });
  const GetVotingPowerRatioHistory = IDL.Record({ days: IDL.Nat64 });
  const Metrics = IDL.Record({
    total_errors: IDL.Nat64,
    total_api_requests: IDL.Nat64,
  });
  const WorkingStatsResponse = IDL.Record({
    metrics: Metrics,
    next_block: IDL.Nat64,
    last_update_time: IDL.Nat64,
    ledger_tip_of_chain: IDL.Nat64,
    timer_active: IDL.Bool,
    is_upto_date: IDL.Bool,
    directory_count: IDL.Nat64,
    is_busy: IDL.Bool,
  });
  return IDL.Service({
    get_account_history: IDL.Func(
      [GetAccountHistoryArgs],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, HistoryData))],
      ["query"]
    ),
    get_account_holders: IDL.Func(
      [GetAccountHoldersArgs],
      [IDL.Vec(HolderBalanceResponseCompat)],
      ["query"]
    ),
    get_account_overview: IDL.Func(
      [IDL.Text],
      [IDL.Opt(OverviewResponse)],
      ["query"]
    ),
    get_active_users_count: IDL.Func([], [ActiveUsers], ["query"]),
    get_activity_stats: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(ActivitySnapshot)],
      ["query"]
    ),
    get_all_neuron_owners: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    get_daily_stats: IDL.Func([], [TimeStats], ["query"]),
    get_foundation_assets: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, WalletOverviewResponse))],
      ["query"]
    ),
    get_holders: IDL.Func([GetHoldersArgs], [GetHoldersResponse], ["query"]),
    get_hourly_stats: IDL.Func([], [TimeStats], ["query"]),
    get_locked_neurons_period: IDL.Func(
      [],
      [LockedNeuronsPeriodResponse],
      ["query"]
    ),
    get_logs: IDL.Func([], [IDL.Vec(LogEntry)], ["query"]),
    get_neurons_stats: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [GovernanceStats],
      ["query"]
    ),
    get_principal_history: IDL.Func(
      [GetAccountHistoryArgs],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, HistoryData))],
      ["query"]
    ),
    get_principal_holders: IDL.Func(
      [GetAccountHoldersArgs],
      [IDL.Vec(HolderBalanceResponseCompat)],
      ["query"]
    ),
    get_principal_overview: IDL.Func(
      [IDL.Text],
      [IDL.Opt(OverviewResponse)],
      ["query"]
    ),
    get_proposals_metrics: IDL.Func([], [ProposalsMetricsResponse], ["query"]),
    get_stake_history: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, HistoryData))],
      ["query"]
    ),
    get_supply_data: IDL.Func([], [TokenSupplyData], ["query"]),
    get_top_account_holders: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(HolderBalanceResponseCompat)],
      ["query"]
    ),
    get_top_principal_holders: IDL.Func(
      [IDL.Nat64],
      [IDL.Vec(HolderBalanceResponseCompat)],
      ["query"]
    ),
    get_total_holders: IDL.Func([], [TotalHolderResponse], ["query"]),
    get_voting_participation_history: IDL.Func(
      [GetVotingParticipationHistoryArgs],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64))],
      ["query"]
    ),
    get_voting_power_ratio_history: IDL.Func(
      [GetVotingPowerRatioHistory],
      [IDL.Vec(IDL.Tuple(IDL.Nat64, IDL.Nat64))],
      ["query"]
    ),
    get_working_stats: IDL.Func([], [WorkingStatsResponse], ["query"]),
    start_processing_timer: IDL.Func([IDL.Nat64], [IDL.Text], []),
    stop_all_timers: IDL.Func([], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => {
  const BuildVersion = IDL.Record({
    major: IDL.Nat32,
    minor: IDL.Nat32,
    patch: IDL.Nat32,
  });
  const UpgradeArgs = IDL.Record({
    version: BuildVersion,
    commit_hash: IDL.Text,
  });
  const InitArgs = IDL.Record({
    test_mode: IDL.Bool,
    foundation_accounts: IDL.Vec(IDL.Text),
    treasury_account: IDL.Text,
    authorized_principals: IDL.Vec(IDL.Principal),
    version: BuildVersion,
    sns_rewards_canister_id: IDL.Principal,
    ogy_new_ledger_canister_id: IDL.Principal,
    commit_hash: IDL.Text,
    sns_governance_canister_id: IDL.Principal,
  });
  const Args = IDL.Variant({ Upgrade: UpgradeArgs, Init: InitArgs });
  return [Args];
};
