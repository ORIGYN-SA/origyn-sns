import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), tsconfigPaths()],
  define: {
    // global: 'globalThis',
    process: {}
  },
  build: {
    target: "ES2022",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          dfinity: [
            "@dfinity/agent",
            "@dfinity/candid",
            "@dfinity/ledger-icp",
            "@dfinity/ledger-icrc",
            "@dfinity/principal",
            "@dfinity/utils",
          ],
          tanstack: ["@tanstack/react-query", "@tanstack/react-table"],
          charts: ["recharts"],
        },
      },
    },
  },
})