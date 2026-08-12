import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { locales } from "./src/i18n/config.ts";
import { injectHead } from "./src/seo/meta.ts";
import { renderOgImage } from "./src/seo/og-image.ts";
import { ogImagePath, pages } from "./src/seo/pages.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The IC asset canister serves a certified `index.html` fallback for unknown
// SPA routes, but a bare directory path can be fragile: an orphaned
// certification node (e.g. left by a removed page) makes the boundary node
// reject the path with a "Response Verification Error" even though deeper
// paths work. Emitting a real `<path>/index.html` makes the path a freshly
// certified asset on every deploy, overwriting any stale node. The SPA still
// negotiates the locale and redirects client-side from unprefixed paths to
// /<locale>/<path> via LocaleRedirect.
const PAGE_PATHS = ["ai", "dpp", "token", "help-center", "integrator", "integrator/join"];

const spaIndexFallback = () => {
  let outDir = "dist";
  let siteUrl = "https://www.origyn.com";
  return {
    name: "spa-index-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      // og:image and canonical URLs have to be absolute, so the build needs to
      // know which origin it is producing.
      siteUrl = (config.env.VITE_SITE_URL ?? siteUrl).replace(/\/+$/, "");
    },
    closeBundle() {
      const baseHtml = fs.readFileSync(path.resolve(__dirname, outDir, "index.html"), "utf8");
      const writeAt = (relative, html) => {
        const dest = path.resolve(__dirname, outDir, relative);
        fs.mkdirSync(dest, { recursive: true });
        fs.writeFileSync(path.join(dest, "index.html"), html);
      };

      for (const page of PAGE_PATHS) {
        const seo = pages.find((entry) => entry.path === page);
        const html = seo ? injectHead(baseHtml, seo, siteUrl) : baseHtml;

        // Unprefixed page path so inbound links keep resolving and the
        // client-side LocaleRedirect can take over.
        writeAt(page, html);
        // Locale-prefixed paths — the canonical URLs after negotiation.
        for (const locale of locales) writeAt(`${locale}/${page}`, html);
      }

      for (const locale of locales) writeAt(locale, baseHtml);
    },
  };
};

// Crawlers fetch og:image as a plain asset, and the site is a static asset
// canister, so the cards are emitted with the bundle rather than on request.
const ogImages = () => ({
  name: "og-images",
  async generateBundle() {
    for (const page of pages) {
      this.emitFile({
        type: "asset",
        fileName: ogImagePath(page).replace(/^\//, ""),
        source: await renderOgImage(page),
      });
    }
  },
});

export default defineConfig({
  plugins: [react(), svgr(), ogImages(), spaIndexFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@styles": path.resolve(__dirname, "./src/styles"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, "src")],
      },
    },
  },
  define: {
    global: "window",
  },
});
