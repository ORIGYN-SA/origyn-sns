export interface ApiAmountCount {
  count: number;
  value: string;
}

export interface ApiLedgerOverview {
  balance: string;
  max_balance: string;
  sent: ApiAmountCount;
  received: ApiAmountCount;
  first_active: number;
  last_active: number;
}

export interface ApiGovernanceOverview {
  total_staked: string;
  total_locked: string;
  total_unlocked: string;
  total_rewards: string;
}

export interface ApiWalletOverview {
  ledger: ApiLedgerOverview;
  governance: ApiGovernanceOverview;
  total: string;
}

export interface ApiHolderRow {
  account: string;
  overview: ApiWalletOverview;
}

export interface ApiHoldersListResponse {
  total_count: number;
  offset: number;
  limit: number;
  data: ApiHolderRow[];
}

export interface ApiSupplySummary {
  total_supply: string;
  circulating_supply: string;
  foundation_balance: string;
}

export interface ApiLockedBracket<T> {
  one_year: T;
  two_years: T;
  three_years: T;
  four_years: T;
  five_years: T;
}

export interface ApiGovernanceStats {
  total_staked: string;
  total_locked: string;
  total_unlocked: string;
  total_rewards: string;
  locked_amount: ApiLockedBracket<string>;
  locked_count: ApiLockedBracket<number>;
}

export interface ApiProposalsMetrics {
  total_proposals: number;
  total_voting_power: string;
  average_voting_power: string;
  average_voting_participation: number;
  daily_voting_rewards: string;
  reward_base_current_year: string;
}

export interface ApiParticipationHistoryItem {
  day: number;
  participation: number;
}

export interface ApiStakeHistoryItem {
  day: number;
  balance: string;
}

export interface ApiActivityItem {
  start_time: number;
  end_time: number;
  total_unique_accounts: number;
  total_unique_principals: number;
  accounts_active: number;
  principals_active: number;
}

export interface ApiActiveUsers {
  active_accounts_count: number;
  active_principals_count: number;
}

export interface ApiAccountTimeseriesItem {
  date: string;
  balance: string | number;
  volume_in: string | number;
  volume_out: string | number;
}
