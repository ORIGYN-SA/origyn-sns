import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defaultLocale, locales } from "./src/i18n/config.ts";
import { injectHead } from "./src/seo/meta.ts";
import { pages } from "./src/seo/pages.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Crawlers never run the SPA, so per page, per locale <head> tags have to be
// emitted here. Real `<path>/index.html` files rather than the canister's SPA
// fallback: a stale certification node otherwise fails a bare directory path
// with "Response Verification Error" even when deeper paths work.
const localeHtml = () => {
  let outDir = "dist";
  const urls = { site: "https://www.origyn.com", cards: "" };
  return {
    name: "locale-html",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      // Canonical and og:image URLs are absolute, so both origins are needed.
      const trim = (value, fallback) => (value ?? fallback).replace(/\/+$/, "");
      urls.site = trim(config.env.VITE_SITE_URL, urls.site);
      urls.cards = trim(config.env.VITE_OG_IMAGE_BASE_URL, "");
      if (!urls.cards) {
        throw new Error("VITE_OG_IMAGE_BASE_URL is unset, so og:image would point nowhere");
      }
    },
    closeBundle() {
      const baseHtml = fs.readFileSync(path.resolve(__dirname, outDir, "index.html"), "utf8");
      const writeAt = (relative, html) => {
        const dest = path.resolve(__dirname, outDir, relative);
        fs.mkdirSync(dest, { recursive: true });
        fs.writeFileSync(path.join(dest, "index.html"), html);
      };

      for (const page of pages) {
        const head = (locale) => injectHead(baseHtml, page, locale, urls);

        // Unprefixed: no locale to go on yet, so LocaleRedirect takes over.
        writeAt(page.path, head(defaultLocale));
        for (const locale of locales) writeAt(`${locale}/${page.path}`, head(locale));
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), svgr(), localeHtml()],
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
