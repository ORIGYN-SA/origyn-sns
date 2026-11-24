import { useQuery } from "@tanstack/react-query";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { encodeIcrcAccount, type IcrcAccount } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";

import { fetchPrice, type PricedSym } from "./api";
import {
  COLLECTIONS,
  gldtIndex,
  icpIndex,
  ledger,
  nftActor,
  nftIndexerActor,
  type Collection,
  type CollectionKey,
  type IcpTokenSym,
} from "../icp/canisters";
import { useIcpSession } from "../icp/session";

/** How long balances and lists stay fresh before they are read again. */
const FRESH_MS = 30_000;

export const usePrice = (sym: PricedSym) =>
  useQuery({ queryKey: ["price", sym], queryFn: () => fetchPrice(sym), staleTime: 60_000 });

const signedIn = (s: ReturnType<typeof useIcpSession>) => (s?.kind === "signedIn" ? s : null);

export const useIcpBalance = (sym: IcpTokenSym) => {
  const s = signedIn(useIcpSession());
  return useQuery({
    queryKey: ["icp-balance", sym, s?.principal.toText()],
    enabled: !!s,
    staleTime: FRESH_MS,
    queryFn: () => {
      if (!s) throw new Error("not signed in");
      return ledger(s.anon, sym).balance({ owner: s.principal, certified: false });
    },
  });
};

export type TxKind = "Transfer" | "Approve" | "Mint" | "Burn";

/** One row of a wallet's transaction list. `from` and `to` are ICRC-1 account text (GLDT) or
 * account identifiers in hex (ICP); null is the minting account. */
export type WalletTx = {
  id: bigint;
  kind: TxKind;
  from: string | null;
  to: string | null;
  amount: bigint;
  /** Epoch ms. */
  at: number;
};

const accountText = (a: IcrcAccount) => encodeIcrcAccount(a);
const icrcAccount = (a: { owner: Principal; subaccount: [] | [Uint8Array | number[]] }): IcrcAccount => ({
  owner: a.owner,
  subaccount: a.subaccount[0] ? Uint8Array.from(a.subaccount[0]) : undefined,
});
const nanosToMs = (n: bigint) => Number(n / 1_000_000n);

const gldtHistory = async (s: NonNullable<ReturnType<typeof signedIn>>): Promise<WalletTx[]> => {
  const res = await gldtIndex(s.anon).getTransactions({
    account: { owner: s.principal },
    max_results: 100n,
    certified: false,
  });
  return res.transactions.flatMap(({ id, transaction: t }): WalletTx[] => {
    const at = nanosToMs(t.timestamp);
    const [transfer] = t.transfer;
    if (transfer) {
      return [
        {
          id,
          kind: "Transfer",
          from: accountText(icrcAccount(transfer.from)),
          to: accountText(icrcAccount(transfer.to)),
          amount: transfer.amount,
          at,
        },
      ];
    }
    const [approve] = t.approve;
    if (approve) {
      return [
        {
          id,
          kind: "Approve",
          from: accountText(icrcAccount(approve.from)),
          to: accountText(icrcAccount(approve.spender)),
          amount: approve.amount,
          at,
        },
      ];
    }
    const [mint] = t.mint;
    if (mint) return [{ id, kind: "Mint", from: null, to: accountText(icrcAccount(mint.to)), amount: mint.amount, at }];
    const [burn] = t.burn;
    if (burn) return [{ id, kind: "Burn", from: accountText(icrcAccount(burn.from)), to: null, amount: burn.amount, at }];
    return [];
  });
};

const icpHistory = async (s: NonNullable<ReturnType<typeof signedIn>>): Promise<WalletTx[]> => {
  const res = await icpIndex(s.anon).getTransactions({
    accountIdentifier: AccountIdentifier.fromPrincipal({ principal: s.principal }).toHex(),
    maxResults: 100n,
    certified: false,
  });
  return res.transactions.map(({ id, transaction: t }): WalletTx => {
    const at = t.timestamp[0] ? nanosToMs(t.timestamp[0].timestamp_nanos) : 0;
    const op = t.operation;
    if ("Transfer" in op) return { id, kind: "Transfer", from: op.Transfer.from, to: op.Transfer.to, amount: op.Transfer.amount.e8s, at };
    if ("Approve" in op) return { id, kind: "Approve", from: op.Approve.from, to: op.Approve.spender, amount: op.Approve.allowance.e8s, at };
    if ("Mint" in op) return { id, kind: "Mint", from: null, to: op.Mint.to, amount: op.Mint.amount.e8s, at };
    return { id, kind: "Burn", from: op.Burn.from, to: null, amount: op.Burn.amount.e8s, at };
  });
};

/** The signed-in account's latest transactions of a token, newest first. */
export const useIcpHistory = (sym: IcpTokenSym) => {
  const s = signedIn(useIcpSession());
  return useQuery({
    queryKey: ["icp-history", sym, s?.principal.toText()],
    enabled: !!s,
    staleTime: FRESH_MS,
    queryFn: () => {
      if (!s) throw new Error("not signed in");
      return sym === "GLDT" ? gldtHistory(s) : icpHistory(s);
    },
  });
};

/** The account identifier the ICP index lists the signed-in principal under. */
export const icpAccountId = (principal: Principal) => AccountIdentifier.fromPrincipal({ principal }).toHex();

const PAGE = 100n;

/** Every NFT id the principal holds in one collection, read page by page. */
const tokensOf = async (s: NonNullable<ReturnType<typeof signedIn>>, c: Collection): Promise<bigint[]> => {
  const actor = nftActor(s.anon, c);
  const out: bigint[] = [];
  let prev: [] | [bigint] = [];
  for (;;) {
    const page: bigint[] = await actor.icrc7_tokens_of({ owner: s.principal, subaccount: [] }, prev, [PAGE]);
    out.push(...page);
    if (BigInt(page.length) < PAGE) return out;
    prev = [page[page.length - 1]];
  }
};

/** The signed-in principal's GLD NFTs, by collection. */
export const useNftHoldings = () => {
  const s = signedIn(useIcpSession());
  return useQuery({
    queryKey: ["nft-holdings", s?.principal.toText()],
    enabled: !!s,
    staleTime: FRESH_MS,
    queryFn: async () => {
      if (!s) throw new Error("not signed in");
      const lists = await Promise.all(COLLECTIONS.map((c) => tokensOf(s, c)));
      return Object.fromEntries(COLLECTIONS.map((c, i) => [c.key, lists[i]])) as Record<CollectionKey, bigint[]>;
    },
  });
};

export type NftTx = { id: bigint; nft: bigint; from: string | null; to: string | null; at: number };

/** The signed-in principal's NFT transfers in one collection, newest first, from its block indexer. */
export const useNftHistory = (c: Collection) => {
  const s = signedIn(useIcpSession());
  return useQuery({
    queryKey: ["nft-history", c.key, s?.principal.toText()],
    enabled: !!s,
    staleTime: FRESH_MS,
    queryFn: async (): Promise<NftTx[]> => {
      if (!s) throw new Error("not signed in");
      const res = await nftIndexerActor(s.anon, c).get_blocks({
        sort_by: [{ Descending: null }],
        filters: [{ Account: { owner: s.principal, subaccount: [] } }],
        start: 0n,
        length: 50n,
      });
      return res.blocks.flatMap((b) => parseNftBlock(b.id, b.block));
    },
  });
};

type Icrc3Value =
  | { Int: bigint }
  | { Map: Array<[string, Icrc3Value]> }
  | { Nat: bigint }
  | { Nat64: bigint }
  | { Blob: Uint8Array | number[] }
  | { Text: string }
  | { Array: Array<Icrc3Value> };

const field = (v: Icrc3Value, key: string): Icrc3Value | undefined =>
  "Map" in v ? v.Map.find(([k]) => k === key)?.[1] : undefined;
const nat = (v: Icrc3Value | undefined): bigint | undefined =>
  v && "Nat" in v ? v.Nat : v && "Nat64" in v ? v.Nat64 : v && "Int" in v ? v.Int : undefined;

/** An ICRC-3 account value ([owner blob, subaccount blob?]) as account text. */
const accountOf = (v: Icrc3Value | undefined): string | null => {
  if (!v || !("Array" in v)) return null;
  const [owner, sub] = v.Array;
  if (!owner || !("Blob" in owner)) return null;
  const principal = Principal.fromUint8Array(Uint8Array.from(owner.Blob));
  const subaccount = sub && "Blob" in sub ? Uint8Array.from(sub.Blob) : undefined;
  return encodeIcrcAccount({ owner: principal, subaccount });
};

/** An ICRC-7 transfer, mint or burn block of the collection, or nothing for other blocks. */
const parseNftBlock = (id: bigint, block: Icrc3Value): NftTx[] => {
  const tx = field(block, "tx");
  if (!tx) return [];
  const nft = nat(field(tx, "tid"));
  const at = nat(field(block, "ts")) ?? nat(field(tx, "ts"));
  if (nft === undefined || at === undefined) return [];
  return [{ id, nft, from: accountOf(field(tx, "from")), to: accountOf(field(tx, "to")), at: nanosToMs(at) }];
};
