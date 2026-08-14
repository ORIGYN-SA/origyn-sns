// Renders the cards locally, the same way og-worker does at the edge. Nothing
// emits them at build time, so this is what catches a script no subset font
// covers. Output lands in the gitignored .og-preview/.
//
//   node scripts/render-cards.mjs                 every page, every locale
//   node scripts/render-cards.mjs en fr ja        those locales only

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import satori from "satori";
import opentype from "@shuding/opentype.js";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import jpeg from "jpeg-js";
import { locales } from "../src/i18n/config.ts";
import { buildCard, cardFamilies, cardLocale, cardOptions, WEIGHTS } from "../src/seo/card.ts";
import { copy } from "../src/seo/copy.ts";
import { CARD_QUALITY, pages } from "../src/seo/pages.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "og-worker", "assets");
const outDir = path.join(root, ".og-preview");

const WEIGHT_FILES = { 300: "Light", 400: "Regular" };

const dataUri = (file, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(assets, file)).toString("base64")}`;

const cache = new Map();
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

const face = (family, weight) =>
  memo(`${family}-${weight}`, () => {
    const bytes = fs.readFileSync(
      path.join(assets, "fonts", `${family}-${WEIGHT_FILES[weight]}.ttf`)
    );
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return { family, weight, data, metrics: opentype.parse(data) };
  });

const art = (file) =>
  memo(`art:${file}`, () =>
    dataUri(path.join("art", file), file.endsWith(".png") ? "image/png" : "image/jpeg")
  );

await initWasm(
  fs.readFileSync(createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm"))
);

const render = async (page, locale) => {
  const fonts = cardFamilies(locale).flatMap((family) =>
    WEIGHTS.map((weight) => face(family, weight))
  );
  const svg = await satori(
    // satori types its input as a React node, but also accepts the plain
    // element tree buildCard returns, which those types do not describe.
    buildCard({
      page,
      locale,
      title: copy(locale, page.keys.cardTitle),
      lead: copy(locale, page.keys.cardLead),
      fonts,
      art: page.card.layout === "type" ? undefined : art(page.card.art.file),
      logo: memo("logo", () => dataUri("origyn-logo-white.png", "image/png")),
    }),
    cardOptions(fonts)
  );
  const rendered = new Resvg(svg).render();
  return jpeg.encode(
    { data: rendered.pixels, width: rendered.width, height: rendered.height },
    CARD_QUALITY
  ).data;
};

const only = process.argv.slice(2);
const targets = only.length ? only : [...new Set(locales.map(cardLocale))];

fs.rmSync(outDir, { recursive: true, force: true });
let total = 0;
let largest = { size: 0 };
for (const locale of targets) {
  fs.mkdirSync(path.join(outDir, locale), { recursive: true });
  for (const page of pages) {
    const image = await render(page, locale);
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
