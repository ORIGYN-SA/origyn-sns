// Renders the cards locally, the same way og-worker does at the edge. Nothing
// emits them at build time, so this is what catches a script no subset font
// covers. Output lands in the gitignored .og-preview/.
//
//   node scripts/render-cards.mjs                 every page, every locale
//   node scripts/render-cards.mjs en fr ja        those locales only

import { renderCard } from "./render-card.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { locales } from "../src/i18n/config.ts";
import { cardLocale } from "../src/seo/card.ts";
import { copy } from "../src/seo/copy.ts";
import { pages } from "../src/seo/pages.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, ".og-preview");

const only = process.argv.slice(2);
const targets = only.length ? only : [...new Set(locales.map(cardLocale))];

fs.rmSync(outDir, { recursive: true, force: true });
let total = 0;
let largest = { size: 0 };
for (const locale of targets) {
  fs.mkdirSync(path.join(outDir, locale), { recursive: true });
  for (const page of pages) {
    const image = await renderCard(page, locale, { title: copy(locale, page.keys.cardTitle), lead: copy(locale, page.keys.cardLead) });
    fs.writeFileSync(path.join(outDir, locale, `${page.id}.jpg`), image);
    total += image.length;
    if (image.length > largest.size) largest = { size: image.length, id: page.id, locale };
  }
  process.stdout.write(`${locale} `);
}

const count = targets.length * pages.length;
console.log(
  `\n${count} cards, ${(total / count / 1024).toFixed(0)}KB average, ` +
    `largest ${(largest.size / 1024).toFixed(0)}KB (${largest.id}/${largest.locale})`
);
console.log(`written to ${path.relative(process.cwd(), outDir)}`);
