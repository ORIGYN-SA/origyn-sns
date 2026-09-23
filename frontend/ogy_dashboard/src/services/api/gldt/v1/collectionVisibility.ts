import type {
  ApiNftListPage,
  ApiNftPage,
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

// Keep server offsets and totals: subtracting only this page's hidden rows
// would make later pages unreachable. Some pages can contain fewer items.
export const filterNftPage = <T extends { collection: string }>(
  page: ApiNftListPage<T>
): ApiNftListPage<T> => ({
  ...page,
  items: page.items.filter((item) => isCollectionVisible(item.collection)),
  collections: page.collections?.filter(visibleCollection),
});

const filterCollectionPage = <T extends { canister_id: string }>(
  page: ApiNftPage<T>
): ApiNftPage<T> => ({
  ...page,
  items: page.items.filter(visibleCollection),
});

export const withVisibleCollections = (api: GldtEndpoints): GldtEndpoints => ({
  ...api,
  getNfts: async (...args) => filterNftPage(await api.getNfts(...args)),
  getNftCollections: async (...args) =>
    filterCollectionPage(await api.getNftCollections(...args)),
  getNftAccountCollections: async (...args) =>
    filterCollectionPage(await api.getNftAccountCollections(...args)),
  getNftOwnerCollections: async (...args) =>
    filterCollectionPage(await api.getNftOwnerCollections(...args)),
  getNftAccountNfts: async (...args) =>
    filterNftPage(await api.getNftAccountNfts(...args)),
  getNftAccountPastNfts: async (...args) =>
    filterNftPage(await api.getNftAccountPastNfts(...args)),
  getNftOwnerNfts: async (...args) =>
    filterNftPage(await api.getNftOwnerNfts(...args)),
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
