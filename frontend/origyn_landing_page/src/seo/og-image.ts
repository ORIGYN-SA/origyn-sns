// Renders a page's Open Graph card to PNG: satori lays out the element tree as
// SVG, resvg rasterizes it, both in WASM so the build needs no native toolchain
// or headless browser. The tree uses the plain shape satori takes (what a React
// element looks like) to keep React out of the build, and only styling satori
// supports: flexbox, gradients and background clipping. There is no `filter`,
// so the ambient glows are radial stops rather than blurred circles.

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import satori from "satori";
import opentype, { type Font } from "@shuding/opentype.js";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import type { Locale } from "../i18n/config.ts";
import { copy } from "./copy.ts";
import { CARD_HEIGHT, CARD_WIDTH, type PageSeo } from "./pages.ts";

// Matches `brand-gradient-bright` in tailwind.config.js.
const BRAND_GRADIENT = "linear-gradient(90deg, #6FD6F5 0%, #1F9CD4 45%, #2E7BC4 100%)";
/** Width the text column has before it would run under the artwork. */
const COLUMN_WIDTH = 560;

const TITLE_SIZE = 44;
const MIN_TITLE_SIZE = 28;
const LEAD_SIZE = 21;
const MIN_LEAD_SIZE = 17;
const MAX_LEAD_LINES = 4;

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");

// satori shapes text one glyph at a time: no bidi reordering, no Arabic
// joining, no Indic cluster reordering. Rendered against Chrome, those scripts
// come out reversed or with vowel signs on the wrong side of their consonant,
// so their pages point at the English card rather than at broken type.
const UNSHAPED_SCRIPTS = new Set(["ar", "bn", "he", "hi", "ur"]);

/** The locale whose card a page in `locale` should link to. */
export const cardLocale = (locale: string): string =>
  UNSHAPED_SCRIPTS.has(locale) ? "en" : locale;

// General Sans is Latin-only, so every other script needs a Noto face behind
// it. Order matters: satori takes the first font that has the glyph, which
// keeps ORIGYN, DPP and ESPR in the brand face inside non-Latin copy.
// Vietnamese is the exception — General Sans has the base letters but none of
// the diacritics, and would split half the words across two faces.
const FALLBACK_FONTS: Record<string, readonly string[]> = {
  bg: ["GeneralSans", "NotoSans"],
  el: ["GeneralSans", "NotoSans"],
  ja: ["GeneralSans", "NotoSansJP"],
  ko: ["GeneralSans", "NotoSansKR"],
  ru: ["GeneralSans", "NotoSans"],
  th: ["GeneralSans", "NotoSansThai"],
  uk: ["GeneralSans", "NotoSans"],
  vi: ["NotoSans"],
  zh: ["GeneralSans", "NotoSansSC"],
  "zh-TW": ["GeneralSans", "NotoSansTC"],
};

// Regenerate all of these with scripts/build-og-fonts.py after a font or copy
// change; satori's parser cannot read the variable originals.
const WEIGHTS = [300, 400] as const;
type Weight = (typeof WEIGHTS)[number];
const WEIGHT_FILES: Record<Weight, string> = { 300: "Light", 400: "Regular" };

const files = new Map<string, Buffer>();
const parsed = new Map<string, Font>();

const fontFile = (family: string, weight: Weight): Buffer => {
  const name = `${family}-${WEIGHT_FILES[weight]}.ttf`;
  if (!files.has(name)) files.set(name, fs.readFileSync(path.join(assetsDir, name)));
  return files.get(name)!;
};

const fontMetrics = (family: string, weight: Weight): Font => {
  const name = `${family}-${weight}`;
  if (!parsed.has(name)) {
    const data = fontFile(family, weight);
    parsed.set(name, opentype.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)));
  }
  return parsed.get(name)!;
};

const familiesFor = (locale: string): readonly string[] =>
  FALLBACK_FONTS[locale] ?? ["GeneralSans"];

/** Advance width of `text`, picking a font per character the way satori does. */
const advance = (fonts: Font[], text: string, size: number, tracking = 0): number => {
  let total = 0;
  for (const char of text) {
    const font = fonts.find((candidate) => candidate.charToGlyphIndex(char) > 0) ?? fonts[0];
    total += (font.charToGlyph(char).advanceWidth ?? 0) / font.unitsPerEm * size;
  }
  return total + tracking * size * text.length;
};

/**
 * Line count for `text` in a column, breaking on spaces where the script has
 * them and anywhere otherwise, which is how CJK wraps.
 */
const lineCount = (fonts: Font[], text: string, size: number, width: number): number => {
  const chunks = text.includes(" ") ? text.split(" ").map((w, i) => (i ? ` ${w}` : w)) : [...text];
  let lines = 1;
  let used = 0;
  for (const chunk of chunks) {
    const chunkWidth = advance(fonts, chunk, size);
    if (used && used + chunkWidth > width) {
      lines += 1;
      used = advance(fonts, chunk.trimStart(), size);
    } else {
      used += chunkWidth;
    }
  }
  return lines;
};

const assertRenderable = (fonts: Font[], locale: string, text: string): void => {
  const missing = [...new Set(text)].filter(
    (char) => !/\s/.test(char) && !fonts.some((font) => font.charToGlyphIndex(char) > 0)
  );
  if (missing.length) {
    throw new Error(
      `No card font covers ${missing.map((c) => `"${c}" (U+${c.codePointAt(0)!.toString(16).toUpperCase()})`).join(", ")} ` +
        `for /${locale}. Re-run scripts/build-og-fonts.py, which subsets the fonts to the copy in use.`
    );
  }
};

type Style = Record<string, unknown>;
type Element = { type: string; props: Record<string, unknown> };

// A childless node must not carry an empty `children` array: satori reads that
// as "more than one child" and demands an explicit display.
const h = (type: string, style: Style, ...children: (Element | string)[]): Element => ({
  type,
  props: { style, children: children.length < 2 ? children[0] : children },
});

const artwork = new Map<string, string>();

const img = (file: string, width: number, style: Style = {}): Element => {
  if (!artwork.has(file)) {
    artwork.set(file, fs.readFileSync(path.join(assetsDir, file)).toString("base64"));
  }
  return {
    type: "img",
    props: {
      src: `data:image/png;base64,${artwork.get(file)}`,
      width,
      style: { display: "flex", ...style },
    },
  };
};

const glow = (position: Style, color: string, size: number): Element =>
  h("div", {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: size,
    backgroundImage: `radial-gradient(circle, ${color} 0%, rgba(6, 25, 55, 0) 70%)`,
    ...position,
  });

const buildCard = (page: PageSeo, locale: string): Element => {
  const families = familiesFor(locale);
  const light = families.map((family) => fontMetrics(family, 300));
  const regular = families.map((family) => fontMetrics(family, 400));

  const lines = copy(locale as Locale, page.keys.cardTitle).split("\n");
  const lead = copy(locale as Locale, page.keys.cardLead);
  assertRenderable(light, locale, lines.join(""));
  assertRenderable(regular, locale, lead);

  // Translations run to any length, so the headline scales down to the column
  // instead of wrapping into the artwork, and the lead follows if it needs to.
  const widest = Math.max(...lines.map((line) => advance(light, line, TITLE_SIZE, -0.02)));
  const titleSize = Math.max(
    MIN_TITLE_SIZE,
    Math.min(TITLE_SIZE, Math.floor((TITLE_SIZE * COLUMN_WIDTH) / widest))
  );
  let leadSize = LEAD_SIZE;
  while (leadSize > MIN_LEAD_SIZE && lineCount(regular, lead, leadSize, COLUMN_WIDTH) > MAX_LEAD_LINES) {
    leadSize -= 1;
  }

  return h(
    "div",
    {
      display: "flex",
      position: "relative",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      overflow: "hidden",
      backgroundColor: "#061937",
      fontFamily: families.join(", "),
      color: "#FFFFFF",
    },

    glow({ top: -240, right: -180 }, "rgba(31, 156, 212, 0.34)", 780),
    glow({ bottom: -280, left: -140 }, "rgba(46, 123, 196, 0.24)", 640),
    img(page.art.file, page.art.width, {
      position: "absolute",
      top: page.art.top,
      right: page.art.right,
    }),

    h(
      "div",
      {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: "58px 64px",
      },

      h("div", { display: "flex" }, img("origyn-logo-white.png", 148)),

      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: COLUMN_WIDTH,
        },

        ...lines.map((line, index) =>
          h(
            "div",
            {
              fontSize: titleSize,
              fontWeight: 300,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              ...(index === lines.length - 1
                ? {
                    backgroundImage: BRAND_GRADIENT,
                    backgroundClip: "text",
                    color: "transparent",
                    // Descenders clip without a little room below the line box.
                    paddingBottom: 6,
                  }
                : {}),
            },
            line
          )
        ),

        h(
          "div",
          {
            marginTop: 22,
            maxWidth: COLUMN_WIDTH,
            fontSize: leadSize,
            lineHeight: 1.5,
            color: "rgba(255, 255, 255, 0.68)",
          },
          lead
        )
      ),

      h(
        "div",
        { display: "flex", alignItems: "center" },
        h("div", {
          width: 56,
          height: 1,
          marginRight: 18,
          backgroundColor: "rgba(255, 255, 255, 0.28)",
        }),
        h(
          "div",
          { fontSize: 19, letterSpacing: "0.02em", color: "rgba(255, 255, 255, 0.58)" },
          "origyn.com"
        )
      )
    )
  );
};

let wasmReady: Promise<void> | null = null;

export const renderOgImage = async (page: PageSeo, locale: string): Promise<Buffer> => {
  const svg = await satori(
    // satori types its input as a React node, but also accepts the plain
    // element tree buildCard returns, which those types do not describe.
    buildCard(page, locale) as unknown as Parameters<typeof satori>[0],
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: familiesFor(locale).flatMap((family) =>
        WEIGHTS.map((weight) => ({
          name: family,
          data: fontFile(family, weight),
          weight,
          style: "normal" as const,
        }))
      ),
    }
  );

  // initWasm throws if called twice, and a watch-mode build can call it again.
  wasmReady ??= initWasm(
    fs.readFileSync(createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm"))
  );
  await wasmReady;

  return Buffer.from(new Resvg(svg).render().asPng());
};
