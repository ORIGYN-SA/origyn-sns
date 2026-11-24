import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { Address } from "viem";

import { getJson, fetchExplorer, type Operation } from "./api";
import type { EvmNet, EvmTokenSym } from "../evm/chains";

/** Ethereum and Base data comes from api.gldt.org, not from the chain: the app reads a chain only
 * while the user signs there. Only GLDT has a history; the other tokens show balances. */

const units = z
  .string()
  .regex(/^\d+$/)
  .transform((s) => BigInt(s));

// A chain is null when its read failed, a token when only its read did.
const balancesSchema = z.object({
  ethereum: z
    .object({ ETH: units.nullable(), GLDT: units.nullable(), USDC: units.nullable(), USDT: units.nullable() })
    .nullable(),
  base: z.object({ ETH: units.nullable(), GLDT: units.nullable(), USDC: units.nullable() }).nullable(),
});
export type EvmBalances = z.infer<typeof balancesSchema>;

/** GET /v1/evm/accounts/{address}/balances: the wallet's balances on both networks, each a decimal
 * string in the token's smallest unit, up to about 30 seconds old. */
const fetchEvmBalances = (address: Address) =>
  getJson(`/v1/evm/accounts/${address}/balances`, balancesSchema);

export const useEvmBalances = (address: Address | undefined) =>
  useQuery({
    queryKey: ["evm-balances", address],
    enabled: !!address,
    staleTime: 30_000,
    retry: false,
    queryFn: () => {
      if (!address) throw new Error("no wallet");
      return fetchEvmBalances(address);
    },
  });

export const evmBalance = (b: EvmBalances, net: EvmNet, sym: EvmTokenSym): bigint | null => {
  if (net === "ethereum") return b.ethereum?.[sym] ?? null;
  return sym === "USDT" ? null : b.base?.[sym] ?? null;
};

export type EvmTx = { key: string; kind: "Transfer" | "Mint" | "Burn"; from: string; to: string; amount: bigint; at: number; txHash: string | null };

const ZERO = "0x0000000000000000000000000000000000000000";

/** A GLDT history row of the explorer feed as the wallet shows it on one network: the bridge's
 * claims arrive as mints, burns to ICP and LayerZero sends leave as burns. */
const gldtRow = (op: Operation, net: EvmNet, me: string): EvmTx | null => {
  const mine = (a: string | null) => !!a && a.toLowerCase() === me;
  const base = { key: op.id, amount: op.amount, at: op.started_at };
  switch (op.kind) {
    case "transfer":
    case "mint":
    case "burn":
      return op.from_chain === net
        ? {
            ...base,
            kind: op.kind === "transfer" ? "Transfer" : op.kind === "mint" ? "Mint" : "Burn",
            from: op.from_address ?? ZERO,
            to: op.to_address ?? ZERO,
            txHash: op.source_tx_hash,
          }
        : null;
    case "icp_to_evm":
    case "nft_to_evm":
      return op.to_chain === net && op.step === "claimed" && mine(op.to_address)
        ? { ...base, kind: "Mint", from: ZERO, to: op.to_address ?? ZERO, txHash: op.dest_tx_hash }
        : null;
    case "evm_to_icp":
      return op.from_chain === net && mine(op.from_address)
        ? { ...base, kind: "Burn", from: op.from_address ?? ZERO, to: ZERO, txHash: op.source_tx_hash }
        : null;
    case "evm_to_evm":
      if (op.from_chain === net && mine(op.from_address))
        return { ...base, kind: "Burn", from: op.from_address ?? ZERO, to: ZERO, txHash: op.source_tx_hash };
      if (op.to_chain === net && op.step === "delivered" && mine(op.to_address))
        return { ...base, kind: "Mint", from: ZERO, to: op.to_address ?? ZERO, txHash: op.dest_tx_hash };
      return null;
    case "approve":
    case "nft_to_gldt":
    case "gldt_to_nft":
      return null;
    default: {
      const exhaustive: never = op.kind;
      return exhaustive;
    }
  }
};

const gldtHistory = async (address: Address, net: EvmNet): Promise<EvmTx[]> => {
  const page = await fetchExplorer({ address: [address], offset: 0, limit: 100 });
  const me = address.toLowerCase();
  return page.data.flatMap((op) => {
    const r = gldtRow(op, net, me);
    return r ? [r] : [];
  });
};

/** The wallet's GLDT history on one network, from the explorer feed. */
export const useEvmGldtHistory = (address: Address | undefined, net: EvmNet) =>
  useQuery({
    queryKey: ["evm-history", address, net],
    enabled: !!address,
    staleTime: 30_000,
    retry: false,
    queryFn: () => {
      if (!address) throw new Error("no wallet");
      return gldtHistory(address, net);
    },
  });
