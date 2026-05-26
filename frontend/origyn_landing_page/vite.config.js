import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The IC asset canister serves a certified `index.html` fallback for unknown
// SPA routes, but a bare directory path like `/ai` is fragile: an orphaned
// certification node (e.g. left by a removed page) makes the boundary node
// reject `/ai` with a "Response Verification Error" even though `/ai/<locale>`
// works. Emitting a real `ai/index.html` makes `/ai` a freshly-certified asset
// on every deploy, overwriting any stale node. The page still client-redirects
// to `/ai/<locale>` via AILocaleGate.
const aiIndexFallback = () => {
  let outDir = "dist";
  return {
    name: "ai-index-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const src = path.resolve(__dirname, outDir, "index.html");
      const destDir = path.resolve(__dirname, outDir, "ai");
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, "index.html"));
    },
  };
};

export default defineConfig({
  plugins: [react(), svgr(), aiIndexFallback()],
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
