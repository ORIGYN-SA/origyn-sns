import assert from "node:assert/strict";
import fs from "node:fs";
import { locales, resolveKey, dirFor } from "../src/i18n/config.ts";
import { pages, matchPage } from "../src/seo/pages.ts";
import { metadata } from "../src/seo/meta.ts";
import { copy } from "../src/seo/copy.ts";

const root = new URL("../", import.meta.url);
let count = 0;
for (const locale of locales) {
  const catalog = JSON.parse(
    fs.readFileSync(new URL(`src/i18n/messages/${locale}.json`, root))
  );
  for (const page of pages) {
    for (const key of Object.values(page.keys))
      assert.equal(
        typeof resolveKey(catalog, key),
        "string",
        `${locale}: ${key}`
      );
    if (page.path.includes(":")) continue;
    const file = new URL(
      `dist/${locale}/${page.path ? `${page.path}/` : ""}index.html`,
      root
    );
    const html = fs.readFileSync(file, "utf8");
    assert.equal((html.match(/<title\b/g) ?? []).length, 1, file.pathname);
    assert.equal((html.match(/name="description"/g) ?? []).length, 1);
    assert.match(
      html,
      new RegExp(`<html lang="${locale}" dir="${dirFor(locale)}">`)
    );
    assert.match(
      html,
      /property="og:image" content="https:\/\/og.bity.com\/dashboard-/
    );
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.ok(
      html.includes(
        `name="robots" content="${page.indexable ? "index,follow" : "noindex,follow"}"`
      )
    );
    count++;
  }
}
const fr = fs.readFileSync(
  new URL("dist/fr/calculator/index.html", root),
  "utf8"
);
assert.match(
  fr,
  /<title[^>]*>Calculateur de coûts \| ORIGYN Dashboard<\/title>/
);
assert.match(
  fr,
  /property="og:image" content="https:\/\/og.bity.com\/dashboard-calculator\/fr.jpg"/
);
const arabic = fs.readFileSync(
  new URL("dist/ar/calculator/index.html", root),
  "utf8"
);
assert.match(arabic, /dashboard-calculator\/en.jpg/);
assert.equal(matchPage("viewer/collections/abc").id, "dashboard-collection");
assert.equal(
  matchPage("transaction-history/transactions/accounts/abc/history").id,
  "dashboard-address-history"
);
assert.equal(matchPage("not-a-page").indexable, false);
const proposal = metadata({
  page: matchPage("proposals/details"),
  locale: "en",
  copy: (key) => copy("en", key),
  search: "?id=42&utm_source=test",
});
assert.equal(
  proposal.canonical,
  "https://dashboard.origyn.com/en/proposals/details?id=42"
);
assert.equal(proposal.title, "Proposals · 42 | ORIGYN Dashboard");
const home = metadata({
  page: matchPage(""),
  locale: "en",
  copy: (key) => copy("en", key),
});
assert.equal(home.title, "Dashboard | ORIGYN Dashboard");
assert.equal(home.alternates.length, 37);
assert.match(
  fs.readFileSync(new URL("dist/sitemap.xml", root), "utf8"),
  /https:\/\/dashboard.origyn.com\/fr\/calculator/
);
assert.doesNotMatch(
  fs.readFileSync(new URL("dist/sitemap.xml", root), "utf8"),
  /\/account<|\/support<|:canisterId/
);
console.log(
  `Verified ${count} emitted localized pages, all 36 catalogs, canonical identifiers, route matching and sitemap.`
);
