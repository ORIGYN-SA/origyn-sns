import type { Address } from "viem";
import { useAccount } from "wagmi";

import gldtLogo from "../assets/gldt.svg";
import icpLogo from "../assets/icp.svg";
import ethLogo from "../assets/eth.png";
import baseLogo from "../assets/base.png";
import usdcLogo from "../assets/usdc.png";
import usdtLogo from "../assets/usdt.png";
import { EVM_TOKENS, NETS, type EvmNet, type EvmToken, type EvmTokenSym } from "../evm/chains";
import { COLLECTIONS, ICP_TOKENS, type IcpTokenSym } from "../icp/canisters";
import { useIcpSession } from "../icp/session";
import { evmBalance, useEvmBalances } from "../data/evm";
import { fetchWallet } from "../data/api";
import { useQuery } from "@tanstack/react-query";
import { useIcpBalance, useNftHoldings, usePrice } from "../data/wallet";
import { fmt, toNumber, usd } from "../lib/format";

/** A token the wallet lists: one of the ICP ledgers, one token on one EVM network, or the GLD NFTs. */
export type WalletToken =
  | { kind: "icp"; sym: IcpTokenSym }
  | { kind: "evm"; token: EvmToken }
  | { kind: "nft" };

export const tokenKey = (t: WalletToken): string =>
  t.kind === "icp" ? `icp:${t.sym}` : t.kind === "evm" ? `evm:${t.token.net}:${t.token.sym}` : "nft";

export const GLDT_ICP: WalletToken = { kind: "icp", sym: "GLDT" };

export const evmToken = (net: EvmNet, sym: EvmTokenSym): EvmToken | null =>
  EVM_TOKENS.find((t) => t.net === net && t.sym === sym) ?? null;

export const NET_INFO = {
  icp: { name: "Internet Computer", logo: icpLogo },
  ethereum: { name: NETS.ethereum.name, logo: ethLogo },
  base: { name: NETS.base.name, logo: baseLogo },
} as const;

export const SYM_INFO: Record<IcpTokenSym | EvmTokenSym, { label: string; img: string; alt: string }> = {
  GLDT: { label: "Gold Token", img: gldtLogo, alt: "GLDT logo" },
  ICP: { label: "Internet Computer", img: icpLogo, alt: "ICP logo" },
  ETH: { label: "Ether", img: ethLogo, alt: "Ethereum logo" },
  USDC: { label: "USD Coin", img: usdcLogo, alt: "USDC logo" },
  USDT: { label: "Tether USD", img: usdtLogo, alt: "USDT logo" },
};

/** Where a balance stands: its network is not connected, it is loading, it is known, or the source
 * could not give it. */
export type Bal =
  | { kind: "off" }
  | { kind: "loading" }
  | { kind: "ready"; units: bigint }
  | { kind: "unavailable" };

export const decimalsOf = (t: WalletToken): number =>
  t.kind === "icp" ? ICP_TOKENS[t.sym].decimals : t.kind === "evm" ? t.token.decimals : 0;

/** Fraction digits the design shows: six for ETH, two otherwise. */
export const digitsOf = (t: WalletToken): number => (t.kind === "evm" && t.token.sym === "ETH" ? 6 : 2);

/** USD per token, or null while it is unknown. Stablecoins count as one dollar. */
export type Prices = { GLDT: number | null; ICP: number | null; ETH: number | null };

export const priceOf = (p: Prices, t: WalletToken): number | null => {
  const sym = t.kind === "icp" ? t.sym : t.kind === "evm" ? t.token.sym : "GLDT";
  if (sym === "USDC" || sym === "USDT") return 1;
  return p[sym];
};

/** The balance text and its USD text, as the token list shows them. */
export const balText = (b: Bal, t: WalletToken, price: number | null): { bal: string; usd: string } => {
  switch (b.kind) {
    case "loading":
      return { bal: "Loading...", usd: "Loading..." };
    case "off":
    case "unavailable":
      return { bal: "—", usd: "" };
    case "ready": {
      const n = toNumber(b.units, decimalsOf(t));
      return { bal: fmt(n, digitsOf(t)), usd: price === null ? "" : usdShort(n * price) };
    }
    default: {
      const exhaustive: never = b;
      return exhaustive;
    }
  }
};

/** "$12.34", or "< $0.01" for dust. */
export const usdShort = (v: number): string => (v > 0 && v < 0.01 ? "< $0.01" : "$" + fmt(v));

export const priceText = (price: number | null, digits = 2) => (price === null ? "" : "$" + fmt(price, digits));

/** Everything the Wallet page reads: who is connected, every balance and every price. */
export const useWalletData = () => {
  const icp = useIcpSession();
  const { address } = useAccount();
  const icpIn = icp?.kind === "signedIn";
  const gldt = useIcpBalance("GLDT");
  const icpBal = useIcpBalance("ICP");
  const nfts = useNftHoldings();
  const evm = useEvmBalances(address);
  // GLDT on Ethereum and Base comes from the explorer's wallet endpoint; the other tokens from the
  // EVM balances endpoint.
  const evmGldt = useQuery({
    queryKey: ["explorer-wallet", address],
    enabled: !!address,
    staleTime: 30_000,
    retry: false,
    queryFn: () => {
      if (!address) throw new Error("no wallet");
      return fetchWallet(address);
    },
  });
  const gldtPrice = usePrice("GLDT");
  const icpPrice = usePrice("ICP");
  const ethPrice = usePrice("ETH");
  const prices: Prices = { GLDT: gldtPrice.data ?? null, ICP: icpPrice.data ?? null, ETH: ethPrice.data ?? null };

  const icpBalOf = (q: typeof gldt): Bal =>
    !icpIn ? { kind: "off" } : q.data !== undefined ? { kind: "ready", units: q.data } : q.isError ? { kind: "unavailable" } : { kind: "loading" };

  const balOf = (t: WalletToken): Bal => {
    if (t.kind === "icp") return icpBalOf(t.sym === "GLDT" ? gldt : icpBal);
    if (t.kind === "nft") {
      if (!icpIn) return { kind: "off" };
      if (!nfts.data) return nfts.isError ? { kind: "unavailable" } : { kind: "loading" };
      return { kind: "ready", units: BigInt(COLLECTIONS.reduce((n, c) => n + nfts.data[c.key].length, 0)) };
    }
    if (!address) return { kind: "off" };
    if (t.token.sym === "GLDT") {
      if (!evmGldt.data) return evmGldt.isError ? { kind: "unavailable" } : { kind: "loading" };
      const n = evmGldt.data.networks.find((x) => x.network === t.token.net);
      return n ? { kind: "ready", units: n.balance } : { kind: "unavailable" };
    }
    if (!evm.data) return evm.isError ? { kind: "unavailable" } : { kind: "loading" };
    const v = evmBalance(evm.data, t.token.net, t.token.sym);
    return v === null ? { kind: "unavailable" } : { kind: "ready", units: v };
  };

  /** Grams of gold the account's NFTs hold. */
  const nftGrams = nfts.data ? COLLECTIONS.reduce((g, c) => g + nfts.data[c.key].length * c.grams, 0) : 0;

  return {
    icp,
    icpIn,
    evmAddress: address as Address | undefined,
    prices,
    balOf,
    nfts,
    nftGrams,
  };
};

export type WalletData = ReturnType<typeof useWalletData>;

export const usdOf = (v: number) => usd(v);
