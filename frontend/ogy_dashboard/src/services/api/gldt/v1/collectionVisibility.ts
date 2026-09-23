import type {
  ApiNftListPage,
  ApiNftCollection,
  PageParams,
  GldtEndpoints,
} from "@origyn/shared-ui/gldt";

// Collection Privée Bochsler. Add canister IDs here to hide more collections.
const DISABLED_COLLECTION_IDS: ReadonlySet<string> = new Set([
  "rm7ew-myaaa-aaaas-qg3uq-cai",
]);

export const isCollectionVisible = (canisterId: string) =>
  !DISABLED_COLLECTION_IDS.has(canisterId);

const visibleCollection = (collection: { canister_id: string }) =>
  isCollectionVisible(collection.canister_id);

// Offsets refer to visible rows. Read one extra result so pagination never
// advertises a next page made up entirely of hidden rows. Until exhausted,
// total is the number of visible rows discovered, not the server's raw total.
const fetchVisiblePage = async <T>(
  fetchPage: (params: PageParams) => Promise<ApiNftListPage<T>>,
  isVisible: (item: T) => boolean,
  { limit = 12, offset = 0 }: PageParams = {}
): Promise<ApiNftListPage<T>> => {
  const items: T[] = [];
  const collections = new Map<string, ApiNftCollection>();
  const batchSize = 100;
  let rawOffset = 0;

  while (items.length < offset + limit + 1) {
    const page = await fetchPage({ limit: batchSize, offset: rawOffset });
    items.push(...page.items.filter(isVisible));
    for (const collection of page.collections ?? []) {
      if (visibleCollection(collection)) {
        collections.set(collection.canister_id, collection);
      }
    }
    rawOffset += page.items.length;
    if (page.items.length === 0 || rawOffset >= page.total) break;
  }

  return {
    items: items.slice(offset, offset + limit),
    collections: [...collections.values()],
    total: items.length,
    limit,
    offset,
  };
};

export const fetchVisibleNftPage = <T extends { collection: string }>(
  fetchPage: (params: PageParams) => Promise<ApiNftListPage<T>>,
  params: PageParams = {}
) =>
  fetchVisiblePage(
    fetchPage,
    (item) => isCollectionVisible(item.collection),
    params
  );

export const withVisibleCollections = (api: GldtEndpoints): GldtEndpoints => ({
  ...api,
  getNfts: (params = {}) =>
    fetchVisibleNftPage((page) => api.getNfts({ ...params, ...page }), params),
  getNftCollections: (params = {}) =>
    fetchVisiblePage(
      (page) => api.getNftCollections({ ...params, ...page }),
      visibleCollection,
      params
    ),
  getNftAccountCollections: (principal, params = {}) =>
    fetchVisiblePage(
      (page) => api.getNftAccountCollections(principal, { ...params, ...page }),
      visibleCollection,
      params
    ),
  getNftOwnerCollections: (principal, params = {}) =>
    fetchVisiblePage(
      (page) => api.getNftOwnerCollections(principal, { ...params, ...page }),
      visibleCollection,
      params
    ),
  getNftAccountNfts: (principal, params = {}) =>
    fetchVisibleNftPage(
      (page) => api.getNftAccountNfts(principal, { ...params, ...page }),
      params
    ),
  getNftAccountPastNfts: (principal, params = {}) =>
    fetchVisibleNftPage(
      (page) => api.getNftAccountPastNfts(principal, { ...params, ...page }),
      params
    ),
  getNftOwnerNfts: (principal, params = {}) =>
    fetchVisibleNftPage(
      (page) => api.getNftOwnerNfts(principal, { ...params, ...page }),
      params
    ),
  getNftSearch: async (...args) => {
    if (!isCollectionVisible(args[0].q.trim())) {
      return { collections: [], nfts: [], accounts: [] };
    }
    const result = await api.getNftSearch(...args);
    return {
      ...result,
      collections: (result.collections ?? []).filter(visibleCollection),
      nfts: (result.nfts ?? []).filter((nft) =>
        isCollectionVisible(nft.collection)
      ),
      accounts: (result.accounts ?? []).filter((account) =>
        isCollectionVisible(account.principal)
      ),
    };
  },
});
