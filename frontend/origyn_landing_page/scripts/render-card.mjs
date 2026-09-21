import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import satori from "satori";
import opentype from "@shuding/opentype.js";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import jpeg from "jpeg-js";
import { buildCard, cardFamilies, cardOptions, WEIGHTS } from "../src/seo/card.ts";
import { CARD_QUALITY } from "../src/seo/pages.ts";
const assets = fileURLToPath(new URL("../og-worker/assets", import.meta.url));
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

export const renderCard = async (page, locale, text) => {
  const fonts = cardFamilies(locale).flatMap((family) =>
    WEIGHTS.map((weight) => face(family, weight))
  );
  const svg = await satori(
    // satori types its input as a React node, but also accepts the plain
    // element tree buildCard returns, which those types do not describe.
    buildCard({
      page,
      locale,
      title: text.title,
      lead: text.lead,
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
