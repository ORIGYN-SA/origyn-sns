import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev-only: serve public/x/ai/index.html at /x/ai and /x/ai/ without changing
// the URL. In production the IC asset canister already resolves dir/index.html.
const aiStaticRoute = {
  name: "ai-static-route",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? "";
      if (url === "/x/ai" || url === "/x/ai/") req.url = "/x/ai/index.html";
      else if (url.startsWith("/x/ai?")) req.url = "/x/ai/index.html" + url.slice(5);
      else if (url.startsWith("/x/ai/?")) req.url = "/x/ai/index.html" + url.slice(6);
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), svgr(), tailwindcss(), aiStaticRoute],
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
