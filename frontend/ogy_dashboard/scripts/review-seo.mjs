import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { locales, dirFor } from "../src/i18n/config.ts";
import { pages } from "../src/seo/pages.ts";
import { metadata } from "../src/seo/meta.ts";
import { copy } from "../src/seo/copy.ts";
import { cardLocale } from "../../origyn_landing_page/src/seo/card.ts";
import { renderCard } from "../../origyn_landing_page/scripts/render-card.mjs";

const out = fileURLToPath(new URL("../.seo-review/", import.meta.url));
fs.mkdirSync(out, { recursive: true });
const data = [];
for (const locale of locales) {
  for (const page of pages) {
    const imageLocale = cardLocale(locale);
    const imagePath = `cards/${page.id}/${imageLocale}.jpg`;
    if (locale === imageLocale) {
      const image = await renderCard(page, locale, {
        title: copy(locale, page.keys.cardTitle),
        lead: copy(locale, page.keys.cardLead),
      });
      fs.mkdirSync(path.dirname(path.join(out, imagePath)), {
        recursive: true,
      });
      fs.writeFileSync(path.join(out, imagePath), image);
    }
    const dynamic = page.path.includes(":");
    const meta = metadata({ page, locale, copy: (key) => copy(locale, key) });
    data.push({
      ...meta,
      id: page.id,
      path: page.path,
      locale,
      dir: dirFor(locale),
      imageLocale,
      imagePath,
      dynamic,
      indexable: page.indexable,
    });
  }
  process.stdout.write(`${locale} `);
}
const languages = locales.map((locale) => ({
  locale,
  name: copy("en", `language.names.${locale}`),
}));
const html = fs
  .readFileSync(new URL("./seo-review.html", import.meta.url), "utf8")
  .replace(
    "/* REVIEW_DATA */",
    `const data = ${JSON.stringify(data).replace(/</g, "\\u003c")}; const languages = ${JSON.stringify(languages).replace(/</g, "\\u003c")};`
  );
fs.writeFileSync(path.join(out, "index.html"), html);
console.log(
  `\nReview: ${out}index.html\nServe with: python3 -m http.server 4174 --bind 127.0.0.1 --directory ${out}`
);
