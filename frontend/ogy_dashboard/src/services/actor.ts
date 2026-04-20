import { Actor, HttpAgent } from "@dfinity/agent";
import type { ActorSubclass, Agent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

import {
  SNS_LEDGER_CANISTER_ID,
  ICP_LEDGER_CANISTER_ID,
  SNS_GOVERNANCE_CANISTER_ID,
  TOKEN_METRICS_CANISTER_ID,
  LEGACY_LEDGER_CANISTER_ID,
  OGY_TOKEN_SWAP_CANISTER_ID,
  SNS_REWARDS_CANISTER_ID,
  TOKEN_STATS_CANISTER_ID,
  COLLECTION_INDEX_CANISTER_ID,
} from "@constants/index";

import { idlFactory as governanceIdl } from "@services/candid/sns_governance";
import { idlFactory as ledgerIdl } from "@services/candid/sns_ledger";
import { idlFactory as ledgerLegacyIdl } from "@services/candid/ledger.legacy";
import { idlFactory as superStatsIdl } from "@services/candid/super_stats";
import { idlFactory as tokenMetricsIdl } from "@services/candid/token_metrics";
import { idlFactory as OGYTokenSwapIdl } from "@services/candid/ogy_token_swap";
import { idlFactory as SNSRewardsIdl } from "@services/candid/sns_rewards";
import { idlFactory as collectionIndexIdl } from "@services/candid/collection_index";

type CanisterKey =
  | "governance"
  | "ledger"
  | "ledgerLegacy"
  | "ledgerICP"
  | "tokenMetrics"
  | "tokenStats"
  | "collectionIndex"
  | "OGYTokenSwap"
  | "SNSRewards";

type CanisterConfig = {
  canisterId: string;
  idlFactory: IDL.InterfaceFactory;
};

export const canisters: Record<CanisterKey, CanisterConfig> = {
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
  collectionIndex: {
    canisterId: COLLECTION_INDEX_CANISTER_ID,
    idlFactory: collectionIndexIdl,
  },
  OGYTokenSwap: {
    canisterId: OGY_TOKEN_SWAP_CANISTER_ID,
    idlFactory: OGYTokenSwapIdl,
  },
  SNSRewards: {
    canisterId: SNS_REWARDS_CANISTER_ID,
    idlFactory: SNSRewardsIdl,
  },
};

export const IC_HOST = "https://icp-api.io";

export const whitelistedCanisterIds = Array.from(
  new Set(Object.values(canisters).map((c) => c.canisterId))
);

let authedAgent: Agent | undefined;
let anonAgent: HttpAgent | undefined;

export const setAuthedAgent = (agent: Agent | undefined): void => {
  authedAgent = agent;
};

export const getAuthedAgent = (): Agent | undefined => authedAgent;

const getAnonAgent = (): HttpAgent => {
  if (!anonAgent) {
    anonAgent = new HttpAgent({ host: IC_HOST });
  }
  return anonAgent;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getActor = async (
  key: CanisterKey,
  { isAnon }: { isAnon: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ActorSubclass<any>> => {
  const cfg = canisters[key];
  if (!cfg) {
    throw new Error(`Unknown canister key: ${key}`);
  }

  let agent: Agent;
  if (isAnon) {
    agent = getAnonAgent();
  } else {
    if (!authedAgent) {
      throw new Error(
        "No authenticated agent available. Connect a wallet before calling this actor."
      );
    }
    agent = authedAgent;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Actor.createActor<any>(cfg.idlFactory, {
    agent,
    canisterId: cfg.canisterId,
  });
};
