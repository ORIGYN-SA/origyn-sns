// The worker has no filesystem, so its copy has to be bundled, and the catalogs
// are 2.4 MB of strings a card never draws. Writes the slice it does need, on
// every deploy, so the cards keep saying what the catalogs say.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { locales } from "../../src/i18n/config.ts";
import { cardLocale } from "../../src/seo/card.ts";
import { copy } from "../../src/seo/copy.ts";
import { pages } from "../../src/seo/pages.ts";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "copy.json");

const table = Object.fromEntries(
  [...new Set(locales.map(cardLocale))].map((locale) => [
    locale,
    Object.fromEntries(
      pages.map((page) => [
        page.id,
        { title: copy(locale, page.keys.cardTitle), lead: copy(locale, page.keys.cardLead) },
      ])
    ),
  ])
);

fs.writeFileSync(out, `${JSON.stringify(table)}\n`);
console.log(
  `${path.relative(process.cwd(), out)}: ${Object.keys(table).length} locales × ${pages.length} pages, ` +
    `${(fs.statSync(out).size / 1024).toFixed(0)}KB`
);
