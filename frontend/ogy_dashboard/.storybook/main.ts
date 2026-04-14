import type { StorybookConfig } from "@storybook/react-vite";
import { dirname } from "path";
import { fileURLToPath } from "url";

const getAbsolutePath = (value: string) =>
  dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));

// Stub VITE_* env vars so module-level expressions like
// BigInt(import.meta.env.VITE_TRANSACTION_FEE) don't throw. Storybook is
// airgapped — these values must never resolve to real canister IDs or APIs.
const STORYBOOK_ENV_STUBS: Record<string, string> = {
  VITE_SNS_LEDGER_CANISTER_ID: "aaaaa-aa",
  VITE_ICP_LEDGER_CANISTER_ID: "aaaaa-aa",
  VITE_SNS_GOVERNANCE_CANISTER_ID: "aaaaa-aa",
  VITE_TOKEN_METRICS_CANISTER_ID: "aaaaa-aa",
  VITE_OGY_TOKEN_SWAP_CANISTER_ID: "aaaaa-aa",
  VITE_SNS_REWARDS_CANISTER_ID: "aaaaa-aa",
  VITE_SNS_ROOT_CANISTER: "aaaaa-aa",
  VITE_TOKEN_STATS_CANISTER_ID: "aaaaa-aa",
  VITE_LEGACY_LEDGER_CANISTER_ID: "aaaaa-aa",
  VITE_LEGACY_GOVERNANCE_CANISTER_ID: "aaaaa-aa",
  VITE_COLLECTION_INDEX_CANISTER_ID: "aaaaa-aa",
  VITE_LEGACY_VESTING_CANISTER_ID: "aaaaa-aa",
  VITE_API_ICRC_V1_BASE_URL: "https://storybook.invalid",
  VITE_API_PLAUSIBLE_BASE_URL: "https://storybook.invalid",
  VITE_API_OGY_BASE_URL: "https://storybook.invalid",
  VITE_API_SNS_BASE_URL: "https://storybook.invalid",
  VITE_API_LEDGER_BASE_URL: "https://storybook.invalid",
  VITE_API_ROSETTA: "https://storybook.invalid",
  VITE_PLAUSIBLE_API_KEY: "stub",
  VITE_ACCOUNT_ID_LEDGER_ICP: "0".repeat(64),
  VITE_ACCOUNT_ID_LEDGER_ICP_OLD: "0".repeat(64),
  VITE_ACCOUNT_ID_LEDGER_OGY: "0".repeat(64),
  VITE_NNS_PLATFORM_URL: "https://storybook.invalid",
  VITE_LEGACY_OGY_DASHBOARD_URL: "https://storybook.invalid",
  VITE_TRANSACTION_FEE: "200000",
  VITE_TRANSACTION_FEE_ICP: "10000",
};

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-onboarding"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config) => {
    config.define = {
      ...(config.define ?? {}),
      ...Object.fromEntries(
        Object.entries(STORYBOOK_ENV_STUBS).map(([k, v]) => [
          `import.meta.env.${k}`,
          JSON.stringify(v),
        ])
      ),
    };
    return config;
  },
};

export default config;
