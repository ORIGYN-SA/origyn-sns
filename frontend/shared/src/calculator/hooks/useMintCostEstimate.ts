import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { idlFactory } from "../services/minting_studio";

// Mainnet Minting Studio canister. Apps may override via the Calculator's
// `canisterId` prop (e.g. the dashboard passes its env-configured value).
export const DEFAULT_MINTING_STUDIO_CANISTER_ID = "uasjq-dyaaa-aaaas-qdwka-cai";

export type MintCostEstimate = {
  breakdown: {
    storage_fee_usd_e8s: bigint;
    base_fee_usd_e8s: bigint;
  };
  total_usd_e8s: bigint;
  ogy_usd_price_e8s: bigint;
  total_ogy_e8s: bigint;
};

type EstimateMintCostArgs = {
  numMints: bigint;
  totalFileSizeBytes: bigint;
};

type EstimateMintCostResult =
  | { Ok: MintCostEstimate }
  | {
      Err: { MintPricingNotConfigured: null } | { OgyPriceNotAvailable: null };
    };

type MintingStudioActor = {
  estimate_mint_cost: (args: {
    num_mints: bigint;
    total_file_size_bytes: bigint;
  }) => Promise<EstimateMintCostResult>;
};

const agent = new HttpAgent({
  host: "https://icp-api.io",
});

// Cache one actor per canister id so we don't rebuild it on every render.
const actorCache = new Map<string, MintingStudioActor>();

const getActor = (canisterId: string): MintingStudioActor => {
  const cached = actorCache.get(canisterId);
  if (cached) return cached;

  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: Principal.fromText(canisterId),
  }) as unknown as MintingStudioActor;
  actorCache.set(canisterId, actor);
  return actor;
};

const describeEstimateError = (
  error: { MintPricingNotConfigured: null } | { OgyPriceNotAvailable: null }
) => {
  if ("MintPricingNotConfigured" in error) {
    return "Mint pricing is not configured for Minting Studio right now.";
  }

  return "OGY price is temporarily unavailable. Try again in a moment.";
};

export const useMintCostEstimate = (
  args: EstimateMintCostArgs | null,
  canisterId: string = DEFAULT_MINTING_STUDIO_CANISTER_ID
) => {
  return useQuery({
    queryKey: [
      "mint-cost-estimate",
      canisterId,
      args?.numMints.toString() ?? "0",
      args?.totalFileSizeBytes.toString() ?? "0",
    ],
    enabled: !!args,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      if (!args) {
        throw new Error("Estimate arguments are required.");
      }

      const result = await getActor(canisterId).estimate_mint_cost({
        num_mints: args.numMints,
        total_file_size_bytes: args.totalFileSizeBytes,
      });

      if ("Err" in result) {
        throw new Error(describeEstimateError(result.Err));
      }

      return result.Ok;
    },
  });
};
