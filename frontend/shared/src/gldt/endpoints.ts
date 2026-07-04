import { makeNftPath, makeTokenPath } from "./utils";
import {
  ApiActiveHoldersItem,
  ApiBurnsHistoryItem,
  ApiDeflationHistoryItem,
  ApiFoundationSummary,
  ApiHoldersCount,
  ApiHoldersTotals,
  ApiNftAccountItem,
  ApiNftAccountStats,
  ApiNftCategoriesResponse,
  ApiNftCollection,
  ApiNftCollectionStats,
  ApiNftCollectionsResponse,
  ApiNftCount,
  ApiNftHeldCollection,
  ApiNftHolderEntry,
  ApiNftItem,
  ApiNftItemsResponse,
  ApiNftOwnedItem,
  ApiNftPage,
  ApiNftSearchResults,
  ApiNftSyncStatus,
  ApiNftTokenIds,
  ApiNftTokenWithMetadata,
  ApiOraBalance,
  ApiOtaBalance,
  ApiPowerRatioItem,
  ApiPriceHistoryItem,
  ApiRichListResponse,
  ApiStatsPeriod,
  ApiStatsSummary,
  ApiSupplyDistributionItem,
  ApiSupplyHistoryGroup,
  ApiTxBucket,
  ApiVolumeTopAccountsResponse,
} from "./types";

interface GldtHttpClient {
  get<T>(path: string): Promise<{ data: T }>;
}

export interface GldtEndpointsConfig {
  tokenSymbol: string;
  nftEnv?: string;
}

export interface PageParams {
  limit?: number;
  offset?: number;
}

export interface NftListParams extends PageParams {
  category?: string;
  collection?: string;
  sort?: string;
  order?: string;
  metadata?: boolean;
}

export interface NftSearchParams {
  q: string;
  category?: string;
  type?: string;
  limit?: number;
  metadata?: boolean;
}

// Typed access to the GLDT analytics API, bound to one http client, token
// symbol and NFT dataset. Both the dashboard and the landing page consume
// this; app-specific data mapping stays in the apps.
export const createGldtEndpoints = (
  client: GldtHttpClient,
  { tokenSymbol, nftEnv = "production" }: GldtEndpointsConfig,
) => {
  const tokenPath = makeTokenPath(tokenSymbol);
  const nftPath = makeNftPath(nftEnv);

  const get = async <T>(path: string): Promise<T> => {
    const { data } = await client.get<T>(path);
    return data;
  };

  return {
    getBurnsHistory: (group: ApiSupplyHistoryGroup = "day") =>
      get<ApiBurnsHistoryItem[]>(tokenPath("burns/history", { group })),

    getDeflationHistory: (group: ApiSupplyHistoryGroup = "day") =>
      get<ApiDeflationHistoryItem[]>(tokenPath("deflation/history", { group })),

    getFoundationSummary: () =>
      get<ApiFoundationSummary>(tokenPath("foundation/summary")),

    getPowerRatioHistory: (days?: number) =>
      get<ApiPowerRatioItem[]>(
        tokenPath("governance/voting/power-ratio-history", { days }),
      ),

    getActiveHoldersHistory: (group: ApiSupplyHistoryGroup = "day") =>
      get<ApiActiveHoldersItem[]>(
        tokenPath("holders/active/timeseries", { group }),
      ),

    getHoldersCount: async () =>
      (await get<ApiHoldersCount>(tokenPath("holders/count"))).count,

    getHoldersTotals: () => get<ApiHoldersTotals>(tokenPath("holders/totals")),

    getRichList: ({
      limit = 20,
      offset = 0,
      ignore,
    }: PageParams & { ignore?: string } = {}) =>
      get<ApiRichListResponse>(
        tokenPath("holders/rich-list", { limit, offset, ignore }),
      ),

    getPriceHistory: (group: ApiSupplyHistoryGroup = "day") =>
      get<ApiPriceHistoryItem[]>(tokenPath("price/history", { group })),

    getOraBalance: () => get<ApiOraBalance>(tokenPath("rewards/ora")),

    getOtaBalance: () => get<ApiOtaBalance>(tokenPath("treasury/ota")),

    getStatsSummary: (period?: ApiStatsPeriod) =>
      get<ApiStatsSummary>(tokenPath("stats/summary", { period })),

    getStatsBuckets: (period?: ApiStatsPeriod) =>
      get<ApiTxBucket[]>(tokenPath("stats/buckets", { period })),

    getSupplyDistributionHistory: (group: ApiSupplyHistoryGroup = "day") =>
      get<ApiSupplyDistributionItem[]>(
        tokenPath("supply/distribution/history", { group }),
      ),

    getVolumeTopAccounts: ({
      limit = 20,
      offset = 0,
      period = "week",
    }: PageParams & { period?: ApiStatsPeriod } = {}) =>
      get<ApiVolumeTopAccountsResponse>(
        tokenPath("volume/top-accounts", { limit, offset, period }),
      ),

    getNftCategories: async () =>
      (await get<ApiNftCategoriesResponse>(nftPath("categories"))).categories ??
      [],

    getNfts: ({
      category,
      collection,
      sort,
      order,
      limit = 12,
      offset = 0,
      metadata = true,
    }: NftListParams = {}) =>
      get<ApiNftItemsResponse>(
        nftPath("nfts", {
          category,
          collection,
          sort,
          order,
          limit,
          offset,
          metadata,
        }),
      ),

    getNftSearch: ({
      q,
      category,
      type,
      limit = 24,
      metadata = true,
    }: NftSearchParams) =>
      get<ApiNftSearchResults>(
        nftPath("search", { q, category, type, limit, metadata }),
      ),

    getNftCollections: ({
      category,
      limit = 12,
      offset = 0,
    }: PageParams & { category?: string } = {}) =>
      get<ApiNftCollectionsResponse>(
        nftPath("collections", { category, limit, offset }),
      ),

    getNftCollectionsCount: async () =>
      (await get<ApiNftCount>(nftPath("collections/count"))).count,

    getNftCollection: (canisterId: string) =>
      get<ApiNftCollection>(
        nftPath(`collections/${encodeURIComponent(canisterId)}`),
      ),

    getNftCollectionStats: (canisterId: string) =>
      get<ApiNftCollectionStats>(
        nftPath(`collections/${encodeURIComponent(canisterId)}/stats`),
      ),

    getNftCollectionHolders: (
      canisterId: string,
      {
        limit = 20,
        offset = 0,
        metadata = false,
      }: PageParams & {
        metadata?: boolean;
      } = {},
    ) =>
      get<ApiNftPage<ApiNftHolderEntry>>(
        nftPath(`collections/${encodeURIComponent(canisterId)}/holders`, {
          metadata,
          limit,
          offset,
        }),
      ),

    getNftCollectionTokenIds: async (
      canisterId: string,
      { prev, take }: { prev?: string; take?: number } = {},
    ) =>
      (
        await get<ApiNftTokenIds>(
          nftPath(`collections/${encodeURIComponent(canisterId)}/token-ids`, {
            prev,
            take,
          }),
        )
      ).token_ids,

    getNftsByIds: (canisterId: string, tokenIds: string[]) =>
      get<ApiNftTokenWithMetadata[]>(
        nftPath(`collections/${encodeURIComponent(canisterId)}/nfts`, {
          ids: tokenIds.join(","),
        }),
      ),

    getNftToken: (canisterId: string, tokenId: string) =>
      get<ApiNftItem>(
        nftPath(
          `collections/${encodeURIComponent(canisterId)}/tokens/${encodeURIComponent(tokenId)}`,
        ),
      ),

    getNftTokenMetadata: (canisterId: string, tokenId: string) =>
      get<ApiNftTokenWithMetadata>(
        nftPath(
          `collections/${encodeURIComponent(canisterId)}/nfts/${encodeURIComponent(tokenId)}`,
        ),
      ),

    getNftAccountStats: (principal: string) =>
      get<ApiNftAccountStats>(
        nftPath(`accounts/${encodeURIComponent(principal)}/stats`),
      ),

    getNftAccountNfts: (
      principal: string,
      {
        collection,
        metadata = true,
        limit = 12,
        offset = 0,
      }: PageParams & { collection?: string; metadata?: boolean } = {},
    ) =>
      get<ApiNftPage<ApiNftAccountItem>>(
        nftPath(`accounts/${encodeURIComponent(principal)}/nfts`, {
          collection,
          metadata,
          limit,
          offset,
        }),
      ),

    getNftAccountPastNfts: (
      principal: string,
      {
        metadata = true,
        limit = 12,
        offset = 0,
      }: PageParams & {
        metadata?: boolean;
      } = {},
    ) =>
      get<ApiNftPage<ApiNftAccountItem>>(
        nftPath(`accounts/${encodeURIComponent(principal)}/past-nfts`, {
          metadata,
          limit,
          offset,
        }),
      ),

    getNftAccountCollections: (
      principal: string,
      { limit = 12, offset = 0 }: PageParams = {},
    ) =>
      get<ApiNftPage<ApiNftHeldCollection>>(
        nftPath(`accounts/${encodeURIComponent(principal)}/collections`, {
          limit,
          offset,
        }),
      ),

    getNftOwnerNfts: (
      principal: string,
      {
        metadata = true,
        limit = 12,
        offset = 0,
      }: PageParams & {
        metadata?: boolean;
      } = {},
    ) =>
      get<ApiNftPage<ApiNftOwnedItem>>(
        nftPath(`owners/${encodeURIComponent(principal)}/nfts`, {
          metadata,
          limit,
          offset,
        }),
      ),

    getNftOwnerCollections: (
      principal: string,
      { limit = 12, offset = 0 }: PageParams = {},
    ) =>
      get<ApiNftPage<ApiNftCollection>>(
        nftPath(`owners/${encodeURIComponent(principal)}/collections`, {
          limit,
          offset,
        }),
      ),

    getNftSyncStatus: () => get<ApiNftSyncStatus>(nftPath("sync-status")),
  };
};

export type GldtEndpoints = ReturnType<typeof createGldtEndpoints>;
