import assert from "node:assert/strict";
import { createGldtEndpoints } from "@origyn/shared-ui/gldt";
import {
  fetchVisibleNftPage,
  isCollectionVisible,
  withVisibleCollections,
} from "../src/services/api/gldt/v1/collectionVisibility.ts";
const hidden = "rm7ew-myaaa-aaaas-qg3uq-cai";
const visible = "io7gn-vyaaa-aaaak-qcbiq-cai";
assert.equal(isCollectionVisible(hidden), false);
assert.equal(isCollectionVisible(visible), true);
const collections = [{ canister_id: hidden }, { canister_id: visible }];
const nfts = [
  hidden,
  hidden,
  hidden,
  visible,
  hidden,
  visible,
  visible,
  visible,
  visible,
].map((collection, index) => ({ collection, token_id: String(index) }));
const requests = [];
const api = withVisibleCollections(
  createGldtEndpoints(
    {
      async get(path) {
        requests.push(path);
        const url = new URL(path, "https://example.test");
        if (url.pathname.endsWith("/search"))
          return {
            data: { collections, nfts, accounts: [{ principal: visible }] },
          };
        const source = url.pathname.endsWith("/collections")
          ? collections
          : nfts;
        const offset = Number(url.searchParams.get("offset") ?? 0);
        // Model an API that caps page size, including entirely hidden pages.
        const limit = Math.min(2, Number(url.searchParams.get("limit") ?? 12));
        return {
          data: {
            items: source.slice(offset, offset + limit),
            collections,
            total: source.length,
            limit,
            offset,
          },
        };
      },
    },
    { tokenSymbol: "OGY", nftEnv: "production" }
  )
);
for (const fetchPage of [
  (params) =>
    api.getNfts({
      ...params,
      category: "Art",
      sort: "minted_at",
      order: "desc",
    }),
  (params) => api.getNftAccountNfts("owner", params),
  (params) => api.getNftAccountPastNfts("owner", params),
  (params) => api.getNftOwnerNfts("owner", { ...params, status: "Received" }),
]) {
  const first = await fetchPage({ limit: 2, offset: 0 });
  assert.deepEqual(
    first.items.map((n) => n.token_id),
    ["3", "5"],
    "Fill hidden first pages with later visible certificates"
  );
  assert.deepEqual(first.collections, [{ canister_id: visible }]);
  assert.ok(first.total > 2);
  const second = await fetchPage({ limit: 2, offset: 2 });
  assert.deepEqual(
    second.items.map((n) => n.token_id),
    ["6", "7"],
    "Visible offsets must not duplicate or skip results"
  );
  const last = await fetchPage({ limit: 2, offset: 4 });
  assert.deepEqual(
    last.items.map((n) => n.token_id),
    ["8"]
  );
  assert.equal(last.total, 5);
  assert.equal(last.offset, 4);
  assert.equal(last.limit, 2);
}
for (const result of await Promise.all([
  api.getNftCollections(),
  api.getNftAccountCollections("owner"),
  api.getNftOwnerCollections("owner"),
])) {
  assert.deepEqual(result.items, [{ canister_id: visible }]);
  assert.equal(result.total, 1);
}
assert.ok(
  requests
    .filter(
      (p) =>
        p.includes("/nfts?") &&
        !p.includes("/accounts/") &&
        !p.includes("/owners/")
    )
    .every(
      (p) =>
        p.includes("category=Art") &&
        p.includes("sort=minted_at") &&
        p.includes("order=desc")
    )
);
assert.ok(
  requests
    .filter((p) => p.includes("/owners/") && p.includes("/nfts?"))
    .every((p) => p.includes("status=Received"))
);
assert.deepEqual(
  (await api.getNftSearch({ q: "gold" })).nfts.map((n) => n.token_id),
  ["3", "5", "6", "7", "8"]
);
const before = requests.length;
assert.deepEqual(await api.getNftSearch({ q: ` ${hidden} ` }), {
  collections: [],
  nfts: [],
  accounts: [],
});
assert.equal(requests.length, before);

for (const rows of [[], nfts.slice(0, 3), nfts.slice(5, 7)]) {
  const result = await fetchVisibleNftPage(
    async ({ offset }) => ({
      items: rows.slice(offset, offset + 2),
      total: rows.length,
      limit: 2,
      offset,
    }),
    { limit: 2 }
  );
  const expected = rows.length === 2 ? ["5", "6"] : [];
  assert.deepEqual(
    result.items.map((item) => item.token_id),
    expected
  );
  assert.equal(result.total, expected.length);
}
await assert.rejects(
  fetchVisibleNftPage(async () => {
    throw new Error("API unavailable");
  }),
  /API unavailable/
);
console.log(
  "Collection visibility checks passed: fallback results, visible offsets, metadata, filters, and search."
);
