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
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { CARD_HEIGHT, CARD_WIDTH, type PageSeo } from "./pages.ts";

// Matches `brand-gradient-bright` in tailwind.config.js.
const BRAND_GRADIENT = "linear-gradient(90deg, #6FD6F5 0%, #1F9CD4 45%, #2E7BC4 100%)";
/** Width the text column has before it would run under the artwork. */
const COLUMN_WIDTH = 540;

const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");

// satori's font parser cannot read public/GeneralSans-Variable.ttf, so each
// weight ships as a static Latin-subset instance of it. After a font update,
// regenerate one per weight with fonttools:
//
//   python3 -m fontTools.varLib.instancer public/GeneralSans-Variable.ttf \
//     wght=300 -o /tmp/gs.ttf
//   python3 -m fontTools.subset /tmp/gs.ttf \
//     --unicodes="U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+20AC,U+2122" \
//     --output-file=src/seo/assets/GeneralSans-Light.ttf
const FONTS = [
  { file: "GeneralSans-Light.ttf", weight: 300 },
  { file: "GeneralSans-Regular.ttf", weight: 400 },
  { file: "GeneralSans-Medium.ttf", weight: 500 },
] as const;

type Style = Record<string, unknown>;
type Element = { type: string; props: Record<string, unknown> };

// A childless node must not carry an empty `children` array: satori reads that
// as "more than one child" and demands an explicit display.
const h = (type: string, style: Style, ...children: (Element | string)[]): Element => ({
  type,
  props: { style, children: children.length < 2 ? children[0] : children },
});

const img = (file: string, width: number, style: Style = {}): Element => ({
  type: "img",
  props: {
    src: `data:image/png;base64,${fs.readFileSync(path.join(assetsDir, file)).toString("base64")}`,
    width,
    style: { display: "flex", ...style },
  },
});

const glow = (position: Style, color: string, size: number): Element =>
  h("div", {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: size,
    backgroundImage: `radial-gradient(circle, ${color} 0%, rgba(6, 25, 55, 0) 70%)`,
    ...position,
  });

const buildCard = ({ eyebrow, title, lead, art }: PageSeo["card"]): Element => {
  const lines = title.split("\n");

  return h(
    "div",
    {
      display: "flex",
      position: "relative",
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      overflow: "hidden",
      backgroundColor: "#061937",
      fontFamily: "General Sans",
      color: "#FFFFFF",
    },

    glow({ top: -240, right: -180 }, "rgba(31, 156, 212, 0.34)", 780),
    glow({ bottom: -280, left: -140 }, "rgba(46, 123, 196, 0.24)", 640),
    img(art.file, art.width, { position: "absolute", top: art.top, right: art.right }),

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

        h(
          "div",
          {
            marginBottom: 20,
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#6FD6F5",
          },
          eyebrow
        ),

        ...lines.map((line, index) =>
          h(
            "div",
            {
              fontSize: 54,
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
            fontSize: 21,
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

export const renderOgImage = async (page: PageSeo): Promise<Buffer> => {
  const svg = await satori(
    // satori types its input as a React node, but also accepts the plain
    // element tree buildCard returns, which those types do not describe.
    buildCard(page.card) as unknown as Parameters<typeof satori>[0],
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: FONTS.map(({ file, weight }) => ({
        name: "General Sans",
        data: fs.readFileSync(path.join(assetsDir, file)),
        weight,
        style: "normal" as const,
      })),
    }
  );

  // initWasm throws if called twice, and a watch-mode build can call it again.
  wasmReady ??= initWasm(
    fs.readFileSync(createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm"))
  );
  await wasmReady;

  return Buffer.from(new Resvg(svg).render().asPng());
};
