import { Actor, type Agent } from "@dfinity/agent";
import { IcrcIndexNgCanister, IcrcLedgerCanister } from "@dfinity/ledger-icrc";
import { IndexCanister as IcpIndexCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

import {
  GLD_NFT_1G_CANISTER_ID,
  GLD_NFT_10G_CANISTER_ID,
  GLD_NFT_100G_CANISTER_ID,
  GLD_NFT_1000G_CANISTER_ID,
  GLD_NFT_1G_INDEXER_CANISTER_ID,
  GLD_NFT_10G_INDEXER_CANISTER_ID,
  GLD_NFT_100G_INDEXER_CANISTER_ID,
  GLD_NFT_1000G_INDEXER_CANISTER_ID,
  GLDT_LEDGER_CANISTER_ID,
  GLDT_LEDGER_INDEXER_CANISTER_ID,
  ICP_INDEX_CANISTER_ID,
  ICP_LEDGER_CANISTER_ID,
  SWAP_CANISTER_ID,
} from "@constants";
import { idlFactory as swapIdl, type _SERVICE as SwapService } from "@canisters/gldt_swap/did";
import { idlFactory as nftIdl } from "@canisters/gld_nft_v2/did";
import type { _SERVICE as NftService } from "@canisters/gld_nft_v2/types";
import { idlFactory as nftIndexerIdl } from "@canisters/gld_nft_indexer/did";
import type { _SERVICE as NftIndexerService } from "@canisters/gld_nft_indexer/types";
import nft1g from "../assets/nft-1g.png";
import nft10g from "../assets/nft-10g.png";
import nft100g from "../assets/nft-100g.png";
import nft1kg from "../assets/nft-1kg.png";

/** The ICP-side tokens of the wallet. Both ledgers speak ICRC-1 and ICRC-2. */
export type IcpTokenSym = "GLDT" | "ICP";

export const ICP_TOKENS = {
  GLDT: { ledger: GLDT_LEDGER_CANISTER_ID, decimals: 8, fee: 10_000_000n },
  ICP: { ledger: ICP_LEDGER_CANISTER_ID, decimals: 8, fee: 10_000n },
} as const satisfies Record<IcpTokenSym, { ledger: string; decimals: number; fee: bigint }>;

export const ledger = (agent: Agent, sym: IcpTokenSym) =>
  IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(ICP_TOKENS[sym].ledger) });

export const gldtIndex = (agent: Agent) =>
  IcrcIndexNgCanister.create({ agent, canisterId: Principal.fromText(GLDT_LEDGER_INDEXER_CANISTER_ID) });

export const icpIndex = (agent: Agent) =>
  IcpIndexCanister.create({ agent, canisterId: Principal.fromText(ICP_INDEX_CANISTER_ID) });

export const gldtSwap = (agent: Agent) =>
  Actor.createActor<SwapService>(swapIdl, { agent, canisterId: SWAP_CANISTER_ID });

export const SWAP_PRINCIPAL = Principal.fromText(SWAP_CANISTER_ID);

/** The four GLD NFT collections. One gram of gold is 100 GLDT. */
export type CollectionKey = "1G" | "10G" | "100G" | "1KG";

export type Collection = {
  key: CollectionKey;
  grams: number;
  label: string;
  weight: string;
  dimensions: string;
  hardness: string;
  canister: string;
  indexer: string;
  img: string;
};

export const COLLECTION: Record<CollectionKey, Collection> = {
  "1G": {
    key: "1G",
    grams: 1,
    label: "1 gram",
    weight: "1 g",
    dimensions: "15 x 8.7 x 0.5 mm",
    hardness: "60 HV",
    canister: GLD_NFT_1G_CANISTER_ID,
    indexer: GLD_NFT_1G_INDEXER_CANISTER_ID,
    img: nft1g,
  },
  "10G": {
    key: "10G",
    grams: 10,
    label: "10 grams",
    weight: "10 g",
    dimensions: "31 x 18 x 1.1 mm",
    hardness: "60 HV",
    canister: GLD_NFT_10G_CANISTER_ID,
    indexer: GLD_NFT_10G_INDEXER_CANISTER_ID,
    img: nft10g,
  },
  "100G": {
    key: "100G",
    grams: 100,
    label: "100 grams",
    weight: "100 g",
    dimensions: "55 x 31 x 3.4 mm",
    hardness: "25 HV",
    canister: GLD_NFT_100G_CANISTER_ID,
    indexer: GLD_NFT_100G_INDEXER_CANISTER_ID,
    img: nft100g,
  },
  "1KG": {
    key: "1KG",
    grams: 1000,
    label: "1 kilogram",
    weight: "1 kg",
    dimensions: "116 x 52 x 9 mm",
    hardness: "25 HV",
    canister: GLD_NFT_1000G_CANISTER_ID,
    indexer: GLD_NFT_1000G_INDEXER_CANISTER_ID,
    img: nft1kg,
  },
};

export const COLLECTION_KEYS: readonly CollectionKey[] = ["1G", "10G", "100G", "1KG"];
export const COLLECTIONS: readonly Collection[] = COLLECTION_KEYS.map((k) => COLLECTION[k]);

/** GLDT e8s one NFT of the collection is worth: 100 GLDT per gram. */
export const nftValueE8s = (c: Collection): bigint => BigInt(c.grams) * 100n * 100_000_000n;

export const nftActor = (agent: Agent, c: Collection) =>
  Actor.createActor<NftService>(nftIdl, { agent, canisterId: c.canister });

export const nftIndexerActor = (agent: Agent, c: Collection) =>
  Actor.createActor<NftIndexerService>(nftIndexerIdl, { agent, canisterId: c.indexer });
