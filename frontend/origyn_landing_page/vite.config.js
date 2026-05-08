import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev-only: serve public/ai/index.html at /ai and /ai/ without changing the
// URL. In production the IC asset canister already resolves dir/index.html.
const aiStaticRoute = {
  name: "ai-static-route",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? "";
      if (url === "/ai" || url === "/ai/") req.url = "/ai/index.html";
      else if (url.startsWith("/ai?")) req.url = "/ai/index.html" + url.slice(3);
      else if (url.startsWith("/ai/?")) req.url = "/ai/index.html" + url.slice(4);
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), svgr(), aiStaticRoute],
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
