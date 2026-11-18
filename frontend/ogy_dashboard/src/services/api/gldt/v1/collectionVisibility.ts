import type {
  ApiNftListPage,
  ApiNftCollection,
  PageParams,
  GldtEndpoints,
} from "@origyn/shared-ui/gldt";

// Add canister IDs here to hide more collections.
const DISABLED_COLLECTION_IDS: ReadonlySet<string> = new Set([
  // Collection Privée Bochsler.
  "rm7ew-myaaa-aaaas-qg3uq-cai",
  // The shared "Origyn AI" collection (production, staging) that Origyn
  // Records and AI agents mint into. The index reports is_ai: false for it.
  "javsv-3qaaa-aaaas-qgvca-cai",
  "2ov74-6yaaa-aaaah-quvia-cai",
]);

export const isCollectionVisible = (canisterId: string) =>
  !DISABLED_COLLECTION_IDS.has(canisterId);

export type IsVisible = (canisterId: string) => boolean;

// Offsets refer to visible rows. Read one extra result so pagination never
// advertises a next page made up entirely of hidden rows. Until exhausted,
// total is the number of visible rows discovered, not the server's raw total.
const fetchVisiblePage = async <T>(
  fetchPage: (params: PageParams) => Promise<ApiNftListPage<T>>,
  idOf: (item: T) => string,
  isVisible: IsVisible,
  { limit = 12, offset = 0 }: PageParams = {}
): Promise<ApiNftListPage<T>> => {
  const items: T[] = [];
  const collections = new Map<string, ApiNftCollection>();
  const batchSize = 100;
  let rawOffset = 0;

  while (items.length < offset + limit + 1) {
    const page = await fetchPage({ limit: batchSize, offset: rawOffset });
    items.push(...page.items.filter((item) => isVisible(idOf(item))));
    for (const collection of page.collections ?? []) {
      if (isVisible(collection.canister_id)) {
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
  isVisible: IsVisible,
  params: PageParams = {}
) => fetchVisiblePage(fetchPage, (item) => item.collection, isVisible, params);

const fetchVisibleCollectionPage = <T extends { canister_id: string }>(
  fetchPage: (params: PageParams) => Promise<ApiNftListPage<T>>,
  params: PageParams = {}
) =>
  fetchVisiblePage(
    fetchPage,
    (collection) => collection.canister_id,
    isCollectionVisible,
    params
  );

const fetchAiCollectionIds = async (api: GldtEndpoints) => {
  const ids = new Set<string>();
  let offset = 0;
  for (;;) {
    const page = await api.getNftCollections({
      collectionType: "ai",
      limit: 100,
      offset,
    });
    for (const collection of page.items) ids.add(collection.canister_id);
    offset += page.items.length;
    if (page.items.length === 0 || offset >= page.total) return ids;
  }
};

// The API flags AI collections with is_ai. Endpoints that accept
// collection_type ask for "normal" collections only. The others can't filter,
// so their results are checked against the list of AI collections.
export const withVisibleCollections = (api: GldtEndpoints) => {
  let aiCollectionIds: Promise<ReadonlySet<string>> | undefined;

  const getIsVisible = async (): Promise<IsVisible> => {
    aiCollectionIds ??= fetchAiCollectionIds(api).catch((error) => {
      aiCollectionIds = undefined;
      throw error;
    });
    const aiIds = await aiCollectionIds;
    return (canisterId) =>
      isCollectionVisible(canisterId) && !aiIds.has(canisterId);
  };

  const fetchVisibleNfts = async <T extends { collection: string }>(
    fetchPage: (params: PageParams) => Promise<ApiNftListPage<T>>,
    params: PageParams = {}
  ) => fetchVisibleNftPage(fetchPage, await getIsVisible(), params);

  return {
    ...api,
    getIsVisible,
    fetchVisibleNfts,
    getNfts: (params = {}) =>
      fetchVisibleNftPage(
        (page) => api.getNfts({ ...params, ...page, collectionType: "normal" }),
        isCollectionVisible,
        params
      ),
    getNftCollections: (params = {}) =>
      fetchVisibleCollectionPage(
        (page) =>
          api.getNftCollections({
            ...params,
            ...page,
            collectionType: "normal",
          }),
        params
      ),
    getNftAccountCollections: (principal, params = {}) =>
      fetchVisibleCollectionPage(
        (page) =>
          api.getNftAccountCollections(principal, {
            ...params,
            ...page,
            collectionType: "normal",
          }),
        params
      ),
    getNftOwnerCollections: (principal, params = {}) =>
      fetchVisibleCollectionPage(
        (page) =>
          api.getNftOwnerCollections(principal, {
            ...params,
            ...page,
            collectionType: "normal",
          }),
        params
      ),
    getNftAccountNfts: (principal, params = {}) =>
      fetchVisibleNfts(
        (page) => api.getNftAccountNfts(principal, { ...params, ...page }),
        params
      ),
    getNftAccountPastNfts: (principal, params = {}) =>
      fetchVisibleNfts(
        (page) => api.getNftAccountPastNfts(principal, { ...params, ...page }),
        params
      ),
    getNftOwnerNfts: (principal, params = {}) =>
      fetchVisibleNfts(
        (page) => api.getNftOwnerNfts(principal, { ...params, ...page }),
        params
      ),
    getNftSearch: async (params) => {
      const empty = { collections: [], nfts: [], accounts: [] };
      const q = params.q.trim();
      if (!isCollectionVisible(q)) return empty;
      const [isVisible, result] = await Promise.all([
        getIsVisible(),
        api.getNftSearch({ ...params, collectionType: "normal" }),
      ]);
      if (!isVisible(q)) return empty;
      return {
        ...result,
        collections: (result.collections ?? []).filter((collection) =>
          isVisible(collection.canister_id)
        ),
        nfts: (result.nfts ?? []).filter((nft) => isVisible(nft.collection)),
        accounts: (result.accounts ?? []).filter((account) =>
          isVisible(account.principal)
        ),
      };
    },
  } satisfies GldtEndpoints & Record<string, unknown>;
};
