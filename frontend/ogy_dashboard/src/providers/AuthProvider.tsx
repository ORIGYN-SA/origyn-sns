import { PropsWithChildren } from "react";
import { Provider as ArtemisProvider } from "artemis-react";
import {
  // APP_MODE,
  SNS_LEDGER_CANISTER_ID,
  ICP_LEDGER_CANISTER_ID,
  SNS_GOVERNANCE_CANISTER_ID,
  TOKEN_METRICS_CANISTER_ID,
  LEGACY_LEDGER_CANISTER_ID,
  OGY_TOKEN_SWAP_CANISTER_ID,
  SNS_REWARDS_CANISTER_ID,
  TOKEN_STATS_CANISTER_ID,
} from "@constants/index";

import { idlFactory as governanceIdl } from "@services/candid/sns_governance";
import { idlFactory as ledgerIdl } from "@services/candid/sns_ledger";
import { idlFactory as ledgerLegacyIdl } from "@services/candid/ledger.legacy";
import { idlFactory as superStatsIdl } from "@services/candid/super_stats";
import { idlFactory as tokenMetricsIdl } from "@services/candid/token_metrics";
import { idlFactory as OGYTokenSwapIdl } from "@services/candid/ogy_token_swap";
import { idlFactory as SNSRewardsIdl } from "@services/candid/sns_rewards";

const AuthProvider = ({ children }: PropsWithChildren) => {
  return (
    <ArtemisProvider
      host="https://identity.ic0.app"
      derivationOrigin="https://jbj2y-2qaaa-aaaal-ajc5q-cai.icp0.io"
      whitelist={[
        SNS_GOVERNANCE_CANISTER_ID,
        SNS_LEDGER_CANISTER_ID,
        LEGACY_LEDGER_CANISTER_ID,
        TOKEN_METRICS_CANISTER_ID,
        OGY_TOKEN_SWAP_CANISTER_ID,
        SNS_REWARDS_CANISTER_ID,
        TOKEN_STATS_CANISTER_ID,
        ICP_LEDGER_CANISTER_ID,
      ]}
      canisters={{
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
        ledgerICP: {
          canisterId: ICP_LEDGER_CANISTER_ID,
          idlFactory: ledgerLegacyIdl,
        },
        tokenMetrics: {
          canisterId: TOKEN_METRICS_CANISTER_ID,
          idlFactory: tokenMetricsIdl,
        },
        tokenStats: {
          canisterId: TOKEN_STATS_CANISTER_ID,
          idlFactory: superStatsIdl,
        },
        OGYTokenSwap: {
          canisterId: OGY_TOKEN_SWAP_CANISTER_ID,
          idlFactory: OGYTokenSwapIdl,
        },
        SNSRewards: {
          canisterId: SNS_REWARDS_CANISTER_ID,
          idlFactory: SNSRewardsIdl,
        },
      }}
    >
      {children}
    </ArtemisProvider>
  );
};

export default AuthProvider;
