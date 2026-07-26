import { Actor, HttpAgent } from "@dfinity/agent";
import type { ActorSubclass, Agent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

import {
  SNS_LEDGER_CANISTER_ID,
  ICP_LEDGER_CANISTER_ID,
  SNS_GOVERNANCE_CANISTER_ID,
  LEGACY_LEDGER_CANISTER_ID,
  OGY_TOKEN_SWAP_CANISTER_ID,
  SNS_REWARDS_CANISTER_ID,
} from "@constants/index";

import { idlFactory as governanceIdl } from "@services/candid/sns_governance";
import { idlFactory as ledgerIdl } from "@services/candid/sns_ledger";
import { idlFactory as ledgerLegacyIdl } from "@services/candid/ledger.legacy";
import { idlFactory as OGYTokenSwapIdl } from "@services/candid/ogy_token_swap";
import { idlFactory as SNSRewardsIdl } from "@services/candid/sns_rewards";

type CanisterKey =
  | "governance"
  | "ledger"
  | "ledgerLegacy"
  | "ledgerICP"
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

// Detect a dead session (II delegation expired, OISY/Plug channel dropped) from
// failed authed calls and expose it via an external store so the UI can prompt
// a reconnect. Matching stays conservative so transient errors don't log out.
const AUTH_EXPIRY_PATTERNS: RegExp[] = [
  /delegation has expired/i,
  /sender delegation/i,
  /invalid delegation/i,
  /delegation.*expir/i,
  /signature could not be verified/i,
  /channel (is|was) closed/i,
  /transport (is|was) closed/i,
  /signer has (been )?disconnected/i,
];

const isAuthExpiryError = (err: unknown): boolean => {
  const message =
    err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return AUTH_EXPIRY_PATTERNS.some((pattern) => pattern.test(message));
};

let authExpired = false;
const authExpiryListeners = new Set<() => void>();

export const subscribeAuthExpiry = (listener: () => void): (() => void) => {
  authExpiryListeners.add(listener);
  return () => {
    authExpiryListeners.delete(listener);
  };
};

export const getAuthExpiredSnapshot = (): boolean => authExpired;

const markAuthExpired = (): void => {
  if (authExpired) return;
  authExpired = true;
  authExpiryListeners.forEach((listener) => listener());
};

export const resetAuthExpiry = (): void => {
  if (!authExpired) return;
  authExpired = false;
  authExpiryListeners.forEach((listener) => listener());
};

// Wrap call/query/readState to flag auth-expiry errors. receiver=target keeps
// private-field getters (e.g. HttpAgent rootKey) working through the Proxy.
const INTERCEPTED_METHODS = new Set(["call", "query", "readState"]);
const wrapAgentWithAuthExpiry = (agent: Agent): Agent =>
  new Proxy(agent, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== "function") return value;
      const fn = value as (...args: unknown[]) => unknown;
      if (typeof prop !== "string" || !INTERCEPTED_METHODS.has(prop)) {
        return fn.bind(target);
      }
      return (...args: unknown[]) => {
        try {
          const result = fn.apply(target, args);
          if (result instanceof Promise) {
            return result.catch((err) => {
              if (isAuthExpiryError(err)) markAuthExpired();
              throw err;
            });
          }
          return result;
        } catch (err) {
          if (isAuthExpiryError(err)) markAuthExpired();
          throw err;
        }
      };
    },
  });

export const setAuthedAgent = (agent: Agent | undefined): void => {
  authedAgent = agent ? wrapAgentWithAuthExpiry(agent) : undefined;
};

export const getAuthedAgent = (): Agent | undefined => authedAgent;

export const getAnonAgent = (): HttpAgent => {
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
