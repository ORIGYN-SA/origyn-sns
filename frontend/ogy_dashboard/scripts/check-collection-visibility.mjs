import assert from "node:assert/strict";
import { createGldtEndpoints } from "@origyn/shared-ui/gldt";
import {
  fetchVisibleNftPage,
  isCollectionVisible,
  withVisibleCollections,
} from "../src/services/api/gldt/v1/collectionVisibility.ts";
const hidden = "rm7ew-myaaa-aaaas-qg3uq-cai";
const visible = "io7gn-vyaaa-aaaak-qcbiq-cai";
const ai = "owasc-kiaaa-aaaas-qhd5a-cai";
assert.equal(isCollectionVisible(hidden), false);
assert.equal(isCollectionVisible(visible), true);
const collections = [
  { canister_id: hidden },
  { canister_id: ai, is_ai: true },
  { canister_id: visible },
];
const isAi = (id) => collections.some((c) => c.canister_id === id && c.is_ai);
const nfts = [
  hidden,
  ai,
  hidden,
  visible,
  ai,
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
        // Model the API: collection_type filters AI collections where the
        // endpoint supports it, and account/owner NFT lists ignore it.
        const type = url.searchParams.get("collection_type");
        const ofType = (id) =>
          type === "ai" ? isAi(id) : type === "normal" ? !isAi(id) : true;
        const typedCollections = collections.filter((c) =>
          ofType(c.canister_id)
        );
        if (url.pathname.endsWith("/search"))
          return {
            data: {
              collections: typedCollections,
              nfts: nfts.filter((n) => ofType(n.collection)),
              accounts: [{ principal: visible }, { principal: ai }],
            },
          };
        const source = url.pathname.endsWith("/collections")
          ? typedCollections
          : nfts.filter((n) => ofType(n.collection));
        const offset = Number(url.searchParams.get("offset") ?? 0);
        // Model an API that caps page size, including entirely hidden pages.
        const limit = Math.min(2, Number(url.searchParams.get("limit") ?? 12));
        return {
          data: {
            items: source.slice(offset, offset + limit),
            collections: typedCollections,
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
  (params) =>
    api.fetchVisibleNfts(
      (page) => api.getNftAccountNfts("owner", page),
      params
    ),
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
assert.ok(
  requests
    .filter(
      (p) =>
        p.includes("/nfts?") &&
        !p.includes("/accounts/") &&
        !p.includes("/owners/")
    )
    .every((p) => p.includes("collection_type=normal")),
  "Ask the API for normal collections where it can filter"
);
assert.ok(
  requests
    .filter(
      (p) => p.includes("/collections?") && !p.includes("collection_type=ai")
    )
    .every((p) => p.includes("collection_type=normal"))
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
assert.ok(
  requests.some(
    (p) => p.includes("/search?") && p.includes("collection_type=normal")
  )
);
assert.deepEqual(
  (await api.getNftSearch({ q: "gold" })).accounts.map((a) => a.principal),
  [visible]
);
assert.deepEqual(await api.getNftSearch({ q: ai }), {
  collections: [],
  nfts: [],
  accounts: [],
});
const isVisible = await api.getIsVisible();
assert.equal(isVisible(ai), false);
assert.equal(isVisible(hidden), false);
assert.equal(isVisible(visible), true);

for (const rows of [[], nfts.slice(0, 3), nfts.slice(5, 7)]) {
  const result = await fetchVisibleNftPage(
    async ({ offset }) => ({
      items: rows.slice(offset, offset + 2),
      total: rows.length,
      limit: 2,
      offset,
    }),
    isVisible,
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
  }, isCollectionVisible),
  /API unavailable/
);
console.log(
  "Collection visibility checks passed: disabled and AI collections, fallback results, visible offsets, metadata, filters, and search."
);
