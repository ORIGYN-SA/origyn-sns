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

export interface ApiTransaction {
  block: number;
  hash: string;
  tx_type: string;
  from_account: string;
  to_account: string;
  value: string;
  tx_time: number;
  fee: string | null;
  spender: string | null;
}

export interface ApiTransactionsResponse {
  total_count: number;
  offset: number;
  limit: number;
  data: ApiTransaction[];
}

export type ApiAccountOverviewResponse = ApiHolderRow;

export type ApiSupplyHistoryGroup = "day" | "week" | "month" | "year";

export interface ApiSupplyHistoryItem {
  date: string;
  total_supply: string;
  total_minted: string;
  total_burned: string;
  minted: string;
  burned: string;
}

export interface ApiBurnSource {
  gldt: number;
  icp: number;
  other: number;
}

export interface ApiBurnsHistoryItem {
  date: string;
  source: ApiBurnSource;
  total_burned: number;
}

export interface ApiDeflationHistoryItem {
  date: string;
  burned: number;
  deflation_rate: number;
}

export interface ApiFoundationSummary {
  locked: string;
  unlocked: string;
  total_foundation_supply: string;
}

export interface ApiPowerRatioItem {
  day: number;
  ratio: number;
}

export interface ApiActiveHoldersItem {
  date: string;
  active_holders: number;
}

export interface ApiHoldersCount {
  count: number;
}

export interface ApiHoldersTotals {
  accounts: number;
  principals: number;
}

export interface ApiRichListRow {
  account: string;
  balance: number;
}

export interface ApiRichListResponse {
  data: ApiRichListRow[];
  total: number;
}

export interface ApiPriceHistoryItem {
  date: string;
  price: number;
}

export interface ApiOraBalance {
  ora_balance: string;
  reserve: string;
  default_pool: string;
  five_year: string;
}

export interface ApiOtaBalance {
  ogy_total_burned: string;
  icp_network_revenue: string;
}

export interface ApiTxBucket {
  start_time: number;
  end_time: number;
  total_count: number;
  transfer_count: number;
  mint_count: number;
  burn_count: number;
  approve_count: number;
}

export interface ApiTxStats {
  count: string;
  total_value: string;
  average: string;
}

export interface ApiMostActiveAccount {
  account: string;
  count: number;
}

export interface ApiMostActivePrincipal {
  principal: string;
  count: number;
}

export interface ApiStatsSummary {
  total_transaction_count: string;
  total_transaction_value: string;
  total_transaction_average: string;
  total_unique_accounts: number;
  total_unique_principals: number;
  transfer_stats: ApiTxStats;
  mint_stats: ApiTxStats;
  burn_stats: ApiTxStats;
  approve_stats: ApiTxStats;
  count_over_time: ApiTxBucket[];
  most_active_accounts: ApiMostActiveAccount[];
  most_active_principals: ApiMostActivePrincipal[];
  top_transfers: ApiTransaction[];
  top_mints: ApiTransaction[];
  top_burns: ApiTransaction[];
}

export interface ApiSupplyDistributionItem {
  date: string;
  liquid: number;
  staked: number;
  treasury: number;
  reward_pool: number;
  unclaimed_rewards: number;
  total_supply: number;
}

export type ApiStatsPeriod = "day" | "week" | "month";

// The endpoint has no OGY data yet, so row fields beyond account are unverified.
export interface ApiVolumeTopAccountRow {
  account: string;
  [key: string]: unknown;
}

export interface ApiVolumeTopAccountsResponse {
  data: ApiVolumeTopAccountRow[];
  total: number;
}

// --- NFT (ORIGYN certificate) API -----------------------------------------

export interface ApiNftPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiNftCollection {
  canister_id: string;
  categories: string[];
  distinct_holders: number;
  indexable: boolean;
  total_tokens: number;
  description: string | null;
  logo: string | null;
  name: string | null;
  owner: string | null;
  symbol: string | null;
}

// Raw certificate JSON; shape varies per collection.
export type ApiNftMetadata = Record<string, unknown>;

export interface ApiNftItem {
  collection: string;
  token_id: string;
  owner_account: string;
  minted_at_ms: number;
  name: string | null;
  description: string | null;
  image_url: string | null;
  // Present only when requested with metadata=true.
  metadata?: ApiNftMetadata | null;
}

export interface ApiNftCategoriesResponse {
  categories: string[];
}

export type ApiNftCollectionsResponse = ApiNftPage<ApiNftCollection>;

// NFT list endpoints also return the collections referenced by the page's
// items, so cards can show collection info without extra requests.
export type ApiNftListPage<T> = ApiNftPage<T> & {
  collections?: ApiNftCollection[];
};

export type ApiNftItemsResponse = ApiNftListPage<ApiNftItem>;

export interface ApiNftHit {
  collection: string;
  token_id: string;
  owner_account: string;
  rank: number;
  name: string | null;
  description: string | null;
  image_url: string | null;
  metadata?: ApiNftMetadata | null;
}

export interface ApiNftCollectionHit {
  canister_id: string;
  categories: string[];
  total_tokens: number;
  rank: number;
  logo: string | null;
  name: string | null;
  owner: string | null;
  symbol: string | null;
}

export interface ApiNftAccountHit {
  principal: string;
  created_collections: number;
  held_tokens: number;
}

export interface ApiNftSearchResults {
  collections: ApiNftCollectionHit[];
  nfts: ApiNftHit[];
  accounts: ApiNftAccountHit[];
}

export interface ApiNftCount {
  count: number;
}

export interface ApiNftCollectionStats {
  canister_id: string;
  distinct_holders: number;
  total_tokens: number;
  next_block_id: number;
}

export interface ApiNftTokenIds {
  token_ids: string[];
}

export interface ApiNftTokenWithMetadata {
  token_id: string;
  owner: string;
  metadata: ApiNftMetadata | null;
}

// Token row on collection holder pages; the collection is implied by the path.
export type ApiNftHolderEntry = Omit<ApiNftItem, "collection">;

// NFT owned by the account in the path; owner_account is implied.
export type ApiNftAccountItem = Omit<ApiNftItem, "owner_account">;

export interface ApiNftOwnedItem {
  collection: string;
  token_id: string;
  status: string;
  current_owner: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  metadata?: ApiNftMetadata | null;
}

export interface ApiNftHeldCollection {
  canister_id: string;
  categories: string[];
  indexable: boolean;
  held_count: number;
  logo: string | null;
  name: string | null;
  owner: string | null;
  symbol: string | null;
}

export interface ApiNftAccountStats {
  principal: string;
  owned_count: number;
  distinct_collections: number;
  first_activity_ms: number;
  last_activity_ms: number;
}

export interface ApiNftSyncCounts {
  collections: number | null;
  current_tokens: number | null;
  distinct_holders: number | null;
  events: number | null;
  indexable_collections: number | null;
  metadata_rows: number | null;
  tokens_missing_metadata: number | null;
}

export interface ApiNftSyncRun {
  service: string;
  status: string;
  started_at_ms: number;
  finished_at_ms: number | null;
  duration_ms: number | null;
  items: number | null;
  error: string | null;
}

export interface ApiNftSyncStatus {
  env: string;
  schema: string;
  schema_ready: boolean;
  counts: ApiNftSyncCounts;
  latest_runs: ApiNftSyncRun[];
}
