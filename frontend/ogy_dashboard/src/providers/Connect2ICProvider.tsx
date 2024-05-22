/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { PropsWithChildren } from "react";
import { createClient } from "@connect2ic/core";
import {
  // AstroX,
  // InfinityWallet,
  // InternetIdentity,
  // NFID,
  // StoicWallet,
  defaultProviders,
} from "@connect2ic/core/providers";
import { Connect2ICProvider } from "@connect2ic/react";
import {
  SNS_LEDGER_CANISTER_ID,
  SNS_GOVERNANCE_CANISTER_ID,
  TOKEN_METRICS_CANISTER_ID,
  LEGACY_LEDGER_CANISTER_ID,
  OGY_TOKEN_SWAP_CANISTER_ID,
  SNS_REWARDS_CANISTER_ID,
} from "@constants/index";

import { idlFactory as governanceIdl } from "@services/candid/sns_governance";
import { idlFactory as ledgerIdl } from "@services/candid/sns_ledger";
import { idlFactory as ledgerLegacyIdl } from "@services/candid/ledger.legacy";
import { idlFactory as tokenMetricsIdl } from "@services/candid/token_metrics";
import { idlFactory as OGYTokenSwapIdl } from "@services/candid/ogy_token_swap";
import { idlFactory as SNSRewardsIdl } from "@services/candid/sns_rewards";

const Provider = ({ children }: PropsWithChildren) => {
  return (
    <Connect2ICProvider
      client={createClient({
        canisters: {
          governance: {
            canisterId: SNS_GOVERNANCE_CANISTER_ID,
            idlFactory: governanceIdl,
          },
          ledger: {
            canisterId: SNS_LEDGER_CANISTER_ID,
            idlFactory: ledgerIdl,
          },
          ledgerLegacy: {
            canisterId: LEGACY_LEDGER_CANISTER_ID,
            idlFactory: ledgerLegacyIdl,
          },
          tokenMetrics: {
            canisterId: TOKEN_METRICS_CANISTER_ID,
            idlFactory: tokenMetricsIdl,
          },
          OGYTokenSwap: {
            canisterId: OGY_TOKEN_SWAP_CANISTER_ID,
            idlFactory: OGYTokenSwapIdl,
          },
          SNSRewards: {
            canisterId: SNS_REWARDS_CANISTER_ID,
            idlFactory: SNSRewardsIdl,
          },
        },
        providers: defaultProviders,
        globalProviderConfig: {
          host: "https://icp-api.io",
          dev: false,
          whitelist: [
            SNS_GOVERNANCE_CANISTER_ID,
            SNS_LEDGER_CANISTER_ID,
            LEGACY_LEDGER_CANISTER_ID,
            TOKEN_METRICS_CANISTER_ID,
            OGY_TOKEN_SWAP_CANISTER_ID,
            SNS_REWARDS_CANISTER_ID,
          ],
          autoConnect: true,
        },
      })}
    >
      {children}
    </Connect2ICProvider>
  );
};

export default Provider;
