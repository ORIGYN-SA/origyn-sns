import type { Collection } from "../icp/canisters";

/** The path of a transaction row's kind icon: Burn, Mint, Approve, or an arrow in or out. */
export const TX_ICON = {
  Burn: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z",
  Mint: "M12 4.5v15m7.5-7.5h-15",
  Approve: "m4.5 12.75 6 6 9-13.5",
  In: "m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25",
  Out: "m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25",
} as const;

export type TxKind = "Transfer" | "Approve" | "Mint" | "Burn";

export const kindIcon = (kind: TxKind, credit: boolean): string =>
  kind === "Transfer" ? (credit ? TX_ICON.In : TX_ICON.Out) : TX_ICON[kind];

export const nftName = (c: Collection, id: bigint) => `GLD NFT ${c.key} #${id}`;
