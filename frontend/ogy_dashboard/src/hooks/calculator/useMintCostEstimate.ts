import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MINTING_STUDIO_CANISTER_ID } from "@constants/index";
import { idlFactory } from "@services/candid/minting_studio";

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
  | { Err: { MintPricingNotConfigured: null } | { OgyPriceNotAvailable: null } };

type MintingStudioActor = {
  estimate_mint_cost: (args: {
    num_mints: bigint;
    total_file_size_bytes: bigint;
  }) => Promise<EstimateMintCostResult>;
};

const agent = new HttpAgent({
  host: "https://icp-api.io",
});

const mintingStudioActor = Actor.createActor(idlFactory, {
  agent,
  canisterId: Principal.fromText(MINTING_STUDIO_CANISTER_ID),
}) as unknown as MintingStudioActor;

const describeEstimateError = (
  error: { MintPricingNotConfigured: null } | { OgyPriceNotAvailable: null }
) => {
  if ("MintPricingNotConfigured" in error) {
    return "Mint pricing is not configured for Minting Studio right now.";
  }

  return "OGY price is temporarily unavailable. Try again in a moment.";
};

export const useMintCostEstimate = (args: EstimateMintCostArgs | null) => {
  return useQuery({
    queryKey: [
      "mint-cost-estimate",
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

      const result = await mintingStudioActor.estimate_mint_cost({
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
