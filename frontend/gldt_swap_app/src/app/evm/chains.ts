import { base, mainnet } from "viem/chains";
import type { Address } from "viem";

/** The EVM networks the GLDT app works with. The keys match the bridge API (`ethereum`, `base`). */
export type EvmNet = "ethereum" | "base";
export const EVM_NETS: readonly EvmNet[] = ["ethereum", "base"];

/** GLDT has the same address on both chains (deployed through CreateX with one salt). */
export const GLDT_TOKEN: Address = "0x084B8b9819573A5EBc92b834e06608E0f41F383B";

export const NETS = {
  ethereum: {
    chain: mainnet,
    name: "Ethereum",
    scan: "https://etherscan.io",
    scanName: "Etherscan",
    lzEid: 30101,
    // Blocks gldt_swap waits on top of a burn before it mints on ICP.
    confirmations: 12,
  },
  base: {
    chain: base,
    name: "Base",
    scan: "https://basescan.org",
    scanName: "Basescan",
    lzEid: 30184,
    confirmations: 120,
  },
} as const satisfies Record<
  EvmNet,
  {
    chain: typeof mainnet | typeof base;
    name: string;
    scan: string;
    scanName: string;
    lzEid: number;
    confirmations: number;
  }
>;

export const netOfChainId = (chainId: number | undefined): EvmNet | null =>
  chainId === mainnet.id ? "ethereum" : chainId === base.id ? "base" : null;

/** The tokens the wallet lists on each EVM network: GLDT, the native coin and stablecoins only. */
export type EvmTokenSym = "GLDT" | "ETH" | "USDC" | "USDT";
export type EvmToken = {
  sym: EvmTokenSym;
  net: EvmNet;
  /** null for the native coin. */
  address: Address | null;
  decimals: number;
};

export const EVM_TOKENS: readonly EvmToken[] = [
  { sym: "GLDT", net: "ethereum", address: GLDT_TOKEN, decimals: 8 },
  { sym: "ETH", net: "ethereum", address: null, decimals: 18 },
  { sym: "USDC", net: "ethereum", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { sym: "USDT", net: "ethereum", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { sym: "GLDT", net: "base", address: GLDT_TOKEN, decimals: 8 },
  { sym: "ETH", net: "base", address: null, decimals: 18 },
  { sym: "USDC", net: "base", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
];

export const txUrl = (net: EvmNet, hash: string) => `${NETS[net].scan}/tx/${hash}`;
export const addressUrl = (net: EvmNet, address: string) => `${NETS[net].scan}/address/${address}`;
