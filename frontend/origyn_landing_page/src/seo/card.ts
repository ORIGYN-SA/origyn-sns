// The card as a satori element tree. Runs on both Node and Cloudflare Workers,
// so fonts, artwork and copy all arrive as arguments rather than being read.
// satori has no `filter`, which is why the glows are radial stops.

import type { Font } from "@shuding/opentype.js";
import { CARD_HEIGHT, CARD_WIDTH, type PageCard, type PageSeo } from "./pages.ts";

// Matches `brand-gradient-bright` in tailwind.config.js.
const BRAND_GRADIENT = "linear-gradient(90deg, #6FD6F5 0%, #1F9CD4 45%, #2E7BC4 100%)";
const INK = "#061937";
const ink = (alpha: number): string => `rgba(6, 25, 55, ${alpha})`;

export const WEIGHTS = [300, 400] as const;
export type Weight = (typeof WEIGHTS)[number];

export type FontFace = {
  family: string;
  weight: Weight;
  data: ArrayBuffer;
  metrics: Font;
};

// satori shapes one glyph at a time: no bidi, no Arabic joining, no Indic
// reordering. These come out reversed or mis-stacked, so they get the English
// card instead.
const UNSHAPED_SCRIPTS = new Set(["ar", "bn", "he", "hi", "ur"]);

export const cardLocale = (locale: string): string =>
  UNSHAPED_SCRIPTS.has(locale) ? "en" : locale;

// Order matters: satori takes the first font that has the glyph, so listing
// General Sans first keeps ORIGYN and DPP in the brand face inside non-Latin
// copy. Vietnamese is the exception, since General Sans has the base letters
// but none of the diacritics.
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

export const cardFamilies = (locale: string): readonly string[] =>
  FALLBACK_FONTS[locale] ?? ["GeneralSans"];

// Ceilings, not fixed sizes: buildCard scales down until the copy fits.
type Scale = {
  column: number;
  title: number;
  minTitle: number;
  titleTracking: number;
  lead: number;
  minLead: number;
  maxLeadLines: number;
};

const SCALES: Record<PageCard["layout"], Scale> = {
  split: { column: 560, title: 44, minTitle: 28, titleTracking: -0.02, lead: 21, minLead: 17, maxLeadLines: 4 },
  feature: { column: 640, title: 92, minTitle: 46, titleTracking: -0.03, lead: 23, minLead: 19, maxLeadLines: 3 },
  type: { column: 700, title: 56, minTitle: 32, titleTracking: -0.02, lead: 22, minLead: 18, maxLeadLines: 4 },
};

const metricsAt = (fonts: FontFace[], weight: Weight): Font[] =>
  fonts.filter((face) => face.weight === weight).map((face) => face.metrics);

/** Advance width, picking a font per character the way satori does. */
const advance = (fonts: Font[], text: string, size: number, tracking = 0): number => {
  let total = 0;
  for (const char of text) {
    const font = fonts.find((candidate) => candidate.charToGlyphIndex(char) > 0) ?? fonts[0];
    total += ((font.charToGlyph(char).advanceWidth ?? 0) / font.unitsPerEm) * size;
  }
  return total + tracking * size * text.length;
};

/** Lines in a column, breaking on spaces or anywhere, as CJK wraps. */
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

/** Fails loudly, since a missing glyph is otherwise a silent row of boxes. */
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
type Child = Element | string | false | null | undefined;

// An empty `children` array reads to satori as "more than one child", and it
// then demands an explicit display.
const h = (type: string, style: Style, ...children: Child[]): Element => {
  const kept = children.filter((child): child is Element | string => Boolean(child));
  return { type, props: { style, children: kept.length < 2 ? kept[0] : kept } };
};

const img = (src: string, style: Style): Element => ({
  type: "img",
  props: { src, style: { display: "flex", ...style } },
});

const glow = (position: Style, color: string, size: number): Element =>
  h("div", {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: size,
    backgroundImage: `radial-gradient(circle, ${color} 0%, ${ink(0)} 70%)`,
    ...position,
  });

const rings = (): Element =>
  h(
    "div",
    { position: "absolute", top: 0, right: 0, width: 640, height: CARD_HEIGHT, display: "flex" },
    ...[
      { size: 250, opacity: 0.34 },
      { size: 420, opacity: 0.2 },
      { size: 600, opacity: 0.12 },
      { size: 800, opacity: 0.07 },
    ].map(({ size, opacity }) =>
      h("div", {
        position: "absolute",
        top: CARD_HEIGHT / 2 - size / 2,
        right: 200 - size / 2,
        width: size,
        height: size,
        borderRadius: size,
        border: `1px solid rgba(111, 214, 245, ${opacity})`,
      })
    ),
    h("div", {
      position: "absolute",
      top: CARD_HEIGHT / 2 - 190,
      right: 10,
      width: 380,
      height: 380,
      borderRadius: 380,
      backgroundImage:
        `radial-gradient(circle, rgba(111, 214, 245, 0.5) 0%, rgba(31, 156, 212, 0.16) 38%, ${ink(0)} 70%)`,
    })
  );

const titleBlock = (lines: string[], size: number, scale: Scale): Element[] =>
  lines.map((line, index) =>
    h(
      "div",
      {
        fontSize: size,
        fontWeight: 300,
        lineHeight: 1.14,
        letterSpacing: `${scale.titleTracking}em`,
        // The closing line carries the gradient, as the page headlines do.
        ...(index === lines.length - 1
          ? {
              backgroundImage: BRAND_GRADIENT,
              backgroundClip: "text",
              color: "transparent",
              // Descenders clip without a little room below the line box.
              paddingBottom: 8,
            }
          : {}),
      },
      line
    )
  );

export type CardInput = {
  page: PageSeo;
  locale: string;
  /** A newline splits it into rendered lines. */
  title: string;
  lead: string;
  fonts: FontFace[];
  /** Data URI. Required unless the layout is `type`. */
  art?: string;
  logo: string;
};

export const buildCard = ({ page, locale, title, lead, fonts, art, logo }: CardInput): Element => {
  const card = page.card;
  const scale = SCALES[card.layout];
  const light = metricsAt(fonts, 300);
  const regular = metricsAt(fonts, 400);

  const lines = title.split("\n");
  assertRenderable(light, locale, lines.join(""));
  assertRenderable(regular, locale, lead);

  const widest = Math.max(
    ...lines.map((line) => advance(light, line, scale.title, scale.titleTracking))
  );
  const titleSize = Math.max(
    scale.minTitle,
    Math.min(scale.title, Math.floor((scale.title * scale.column) / widest))
  );
  let leadSize = scale.lead;
  while (
    leadSize > scale.minLead &&
    lineCount(regular, lead, leadSize, scale.column) > scale.maxLeadLines
  ) {
    leadSize -= 1;
  }

  const feature = card.layout === "feature";

  return h(
    "div",
    {
      display: "flex",
      position: "relative",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      overflow: "hidden",
      backgroundColor: INK,
      fontFamily: cardFamilies(locale).join(", "),
      color: "#FFFFFF",
    },

    // A full-bleed photograph carries its own light, so it replaces the glows.
    feature && art
      ? img(art, { position: "absolute", top: 0, left: 0, width: CARD_WIDTH, height: CARD_HEIGHT })
      : glow({ top: -240, right: -180 }, "rgba(31, 156, 212, 0.34)", 780),
    feature
      ? h("div", {
          position: "absolute",
          top: 0,
          left: 0,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundImage: `linear-gradient(90deg, ${ink(0.97)} 0%, ${ink(0.92)} 40%, ${ink(0.45)} 74%, ${ink(0.2)} 100%)`,
        })
      : glow({ bottom: -280, left: -140 }, "rgba(46, 123, 196, 0.24)", 640),

    card.layout === "type" && rings(),
    card.layout === "split" && art
      ? img(art, {
          position: "absolute",
          top: card.art.top,
          right: card.art.right,
          width: card.art.width,
        })
      : null,

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

      h("div", { display: "flex" }, img(logo, { width: 148 })),

      h(
        "div",
        { display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: scale.column },

        ...titleBlock(lines, titleSize, scale),

        h(
          "div",
          {
            marginTop: feature ? 18 : 22,
            maxWidth: scale.column,
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

export const cardOptions = (fonts: FontFace[]) => ({
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  fonts: fonts.map((face) => ({
    name: face.family,
    data: face.data,
    weight: face.weight,
    style: "normal" as const,
  })),
});
