import assert from "node:assert/strict";
import { createGldtEndpoints } from "@origyn/shared-ui/gldt";
import {
  filterNftPage,
  isCollectionVisible,
  withVisibleCollections,
} from "../src/services/api/gldt/v1/collectionVisibility.ts";

const hidden = "rm7ew-myaaa-aaaas-qg3uq-cai";
const visible = "io7gn-vyaaa-aaaak-qcbiq-cai";
assert.equal(isCollectionVisible(hidden), false);
assert.equal(isCollectionVisible(visible), true);

const collections = [{ canister_id: hidden }, { canister_id: visible }];
const nfts = [
  { collection: hidden, token_id: "1" },
  { collection: visible, token_id: "2" },
];
const page = { items: nfts, collections, total: 40, limit: 2, offset: 10 };
const requests = [];
const api = withVisibleCollections(
  createGldtEndpoints(
    {
      async get(path) {
        requests.push(path);
        const url = new URL(path, "https://example.test");
        if (url.pathname.endsWith("/search")) {
          return {
            data: { collections, nfts, accounts: [{ principal: visible }] },
          };
        }
        return {
          data: url.pathname.endsWith("/collections")
            ? { ...page, items: collections }
            : page,
        };
      },
    },
    { tokenSymbol: "OGY", nftEnv: "production" }
  )
);

for (const result of await Promise.all([
  api.getNfts({ limit: 2, offset: 10 }),
  api.getNftAccountNfts("owner", { limit: 2, offset: 10 }),
  api.getNftAccountPastNfts("owner", { limit: 2, offset: 10 }),
  api.getNftOwnerNfts("owner", { limit: 2, offset: 10 }),
])) {
  assert.deepEqual(result.items, [{ collection: visible, token_id: "2" }]);
  assert.deepEqual(result.collections, [{ canister_id: visible }]);
  assert.equal(result.total, 40);
  assert.equal(result.offset, 10);
  assert.equal(result.limit, 2);
}
assert.ok(requests.every((path) => path.includes("offset=10")));

for (const result of await Promise.all([
  api.getNftCollections(),
  api.getNftAccountCollections("owner"),
  api.getNftOwnerCollections("owner"),
])) {
  assert.deepEqual(result.items, [{ canister_id: visible }]);
  assert.equal(result.total, 40);
}

assert.deepEqual(await api.getNftSearch({ q: "gold" }), {
  collections: [{ canister_id: visible }],
  nfts: [{ collection: visible, token_id: "2" }],
  accounts: [{ principal: visible }],
});
const before = requests.length;
assert.deepEqual(await api.getNftSearch({ q: ` ${hidden} ` }), {
  collections: [],
  nfts: [],
  accounts: [],
});
assert.equal(requests.length, before);

const emptyPage = filterNftPage({ ...page, items: [nfts[0]] });
assert.deepEqual(emptyPage.items, []);
assert.equal(emptyPage.total, 40);
assert.equal(emptyPage.offset, 10);
assert.deepEqual(filterNftPage({ ...page, items: [] }).items, []);
assert.equal(page.items.length, 2);

console.log(
  "Collection visibility checks passed: lists, search, collectors, and pagination."
);
