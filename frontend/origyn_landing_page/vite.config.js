import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { locales } from "./src/i18n/config.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The IC asset canister serves a certified `index.html` fallback for unknown
// SPA routes, but a bare directory path can be fragile: an orphaned
// certification node (e.g. left by a removed page) makes the boundary node
// reject the path with a "Response Verification Error" even though deeper
// paths work. Emitting a real `<path>/index.html` makes the path a freshly
// certified asset on every deploy, overwriting any stale node. The SPA still
// negotiates the locale and redirects client-side from unprefixed paths to
// /<locale>/<path> via LocaleRedirect.
const PAGE_PATHS = ["ai", "token", "help-center", "integrator", "integrator/join"];

const spaIndexFallback = () => {
  let outDir = "dist";
  return {
    name: "spa-index-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const src = path.resolve(__dirname, outDir, "index.html");
      const writeAt = (relative) => {
        const dest = path.resolve(__dirname, outDir, relative);
        fs.mkdirSync(dest, { recursive: true });
        fs.copyFileSync(src, path.join(dest, "index.html"));
      };

      // Unprefixed page paths so inbound links keep resolving and the
      // client-side LocaleRedirect can take over.
      for (const page of PAGE_PATHS) writeAt(page);

      // Locale-prefixed paths — the canonical URLs after negotiation.
      for (const locale of locales) {
        writeAt(locale);
        for (const page of PAGE_PATHS) writeAt(`${locale}/${page}`);
      }
    },
  };
};

export default defineConfig({
  plugins: [react(), svgr(), spaIndexFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@origyn/shared": path.resolve(__dirname, "../shared/src"),
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
