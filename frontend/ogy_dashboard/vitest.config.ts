import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Standalone rather than merged with vite.config.ts: the tests need the path
// aliases, not the SEO or node polyfill plugins.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      VITE_TRANSACTION_FEE: "200000",
    },
    server: {
      deps: {
        // The fork only exposes its entry through "module"/"main" export
        // conditions, which Node's own resolver ignores.
        inline: ["@amerej/identitykit"],
      },
    },
  },
});
