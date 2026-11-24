import { z } from "zod";

import { GLDT_API_BASE_URL } from "@constants";

/** api.gldt.org: prices, the explorer feed and the bridge, parsed where they enter the app. */
export const getJson = async <S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  params?: Record<string, string>
): Promise<z.output<S>> => {
  const url = new URL(path, GLDT_API_BASE_URL);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`api.gldt.org ${path}: ${res.status} ${await res.text()}`);
  return schema.parse(await res.json());
};

export type PricedSym = "GLDT" | "ICP" | "ETH";

/** The latest USD price of a token the API prices (GLDT, ICP, ETH). */
export const fetchPrice = (sym: PricedSym) =>
  getJson(`/v1/tokens/${sym.toLowerCase()}/price/latest`, z.number().positive());

/** A decimal string of an integer amount in the token's smallest unit. */
const units = z
  .string()
  .regex(/^\d+$/)
  .transform((s) => BigInt(s));

const chain = z.enum(["icp", "ethereum", "base"]);

/** One row of the explorer feed and the bridge list (`BridgeOperation` in gold-dao-services). */
export const operationSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "icp_to_evm",
    "nft_to_evm",
    "evm_to_icp",
    "evm_to_evm",
    "nft_to_gldt",
    "gldt_to_nft",
    "transfer",
    "approve",
    "mint",
    "burn",
  ]),
  status: z.enum(["pending", "completed", "failed", "needs_attention"]),
  step: z.string(),
  status_detail: z.string().nullable(),
  from_chain: chain,
  to_chain: chain,
  from_address: z.string().nullable(),
  to_address: z.string().nullable(),
  amount: units,
  started_at: z.number(),
  finished_at: z.number().nullable(),
  icp_block_index: z.number().nullable(),
  source_tx_hash: z.string().nullable(),
  dest_tx_hash: z.string().nullable(),
  evm_burn_id: z.number().nullable(),
  guid: z.string().nullable(),
  confirmations: z.number().nullable(),
  required_confirmations: z.number().nullable(),
  nft_canister: z.string().nullable(),
  nft_id: z.string().nullable(),
  nft_label: z.string().nullable(),
  fee: units.nullable(),
  memo: z.string().nullable(),
  // Served once the explorer additions are deployed; absent before.
  parent_id: z.string().nullable().optional(),
  block_hash: z.string().nullable().optional(),
  source_block_number: z.number().nullable().optional(),
  dest_block_number: z.number().nullable().optional(),
  layerzero_fee: z.string().nullable().optional(),
});
export type Operation = z.infer<typeof operationSchema>;
export type OperationKind = Operation["kind"];
export type Chain = z.infer<typeof chain>;

export const pageSchema = <S extends z.ZodTypeAny>(row: S) =>
  z.object({
    total_count: z.number(),
    offset: z.number(),
    limit: z.number(),
    data: z.array(row),
  });
export type Page<T> = { total_count: number; offset: number; limit: number; data: T[] };

const stepSchema = z.object({
  name: z.string(),
  state: z.enum(["done", "current", "waiting", "failed"]),
  at: z.number().nullable(),
  chain,
  tx_hash: z.string().nullable(),
  block_index: z.number().nullable(),
  url: z.string().nullable(),
});
export type OperationStep = z.infer<typeof stepSchema>;

const voucherSchema = z.object({
  chain_id: z.number(),
  token: z.string(),
  icp_burn_index: z.string().regex(/^\d+$/),
  recipient: z.string(),
  amount: z.string().regex(/^\d+$/),
  signature: z.string(),
});
export type ClaimVoucher = z.infer<typeof voucherSchema>;

export const detailsSchema = operationSchema.extend({
  steps: z.array(stepSchema),
  nfts: z.array(
    z.object({
      canister: z.string(),
      id: z.string(),
      label: z.string().nullable(),
      amount: units,
      swap_id: z.string(),
    })
  ),
  layerzero_url: z.string().nullable(),
  voucher: voucherSchema.nullable(),
  /** The ledger blocks and EVM transfers the operation is made of, oldest first. */
  legs: z.array(operationSchema).optional(),
});
export type OperationDetails = z.infer<typeof detailsSchema>;

export type ListParams = {
  q?: string;
  address?: string[];
  kind?: OperationKind[];
  from_chain?: Chain[];
  to_chain?: Chain[];
  status?: Operation["status"];
  offset: number;
  limit: number;
};

const listQuery = (p: ListParams): Record<string, string> => {
  const q: Record<string, string> = { offset: String(p.offset), limit: String(p.limit) };
  if (p.q) q.q = p.q;
  if (p.address?.length) q.address = p.address.join(",");
  if (p.kind?.length) q.kind = p.kind.join(",");
  if (p.from_chain?.length) q.from_chain = p.from_chain.join(",");
  if (p.to_chain?.length) q.to_chain = p.to_chain.join(",");
  if (p.status) q.status = p.status;
  return q;
};

/** Bridge operations and NFT swaps, newest first. */
export const fetchBridgeOperations = (p: ListParams) =>
  getJson("/v1/tokens/gldt/bridge/operations", pageSchema(operationSchema), listQuery(p));

export const fetchBridgeOperation = (id: string) =>
  getJson(`/v1/tokens/gldt/bridge/operations/${encodeURIComponent(id)}`, detailsSchema);

/** Everything that happens to GLDT on every chain, newest first. */
export const fetchExplorer = (p: ListParams) =>
  getJson("/v1/tokens/gldt/explorer", pageSchema(operationSchema), listQuery(p));

export const fetchExplorerItem = (id: string) =>
  getJson(`/v1/tokens/gldt/explorer/${encodeURIComponent(id)}`, detailsSchema);

/** The gold price per gram in USD, the price the GLD NFTs are shown at. */
export const fetchGoldPrice = async () =>
  (
    await getJson(
      "/v1/tokens/gldt/gold/summary",
      z.object({ gold_price_usd_per_gram: z.number().positive() })
    )
  ).gold_price_usd_per_gram;

const network = z.enum(["icp", "ethereum", "base"]);

/** One wallet's GLDT: in all, per network, and a principal's subaccounts. */
export const walletSchema = z.object({
  address: z.string(),
  address_type: z.enum(["evm", "principal", "account"]),
  balance: units,
  networks: z.array(z.object({ network, balance: units, block: z.number().nullable() })),
  subaccounts: z.array(z.object({ account: z.string(), subaccount: z.string().nullable(), balance: units })),
  subaccount_count: z.number(),
});
export type Wallet = z.infer<typeof walletSchema>;

export const fetchWallet = (address: string) =>
  getJson(`/v1/tokens/gldt/explorer/wallets/${encodeURIComponent(address)}`, walletSchema);

/** The largest holders, one row per address and network. */
export const fetchHolders = (p: { network: Chain[]; offset: number; limit: number }) =>
  getJson(
    "/v1/tokens/gldt/explorer/holders",
    pageSchema(z.object({ address: z.string(), network, balance: units })),
    { network: p.network.join(","), offset: String(p.offset), limit: String(p.limit) }
  );

export const fetchExplorerStats = () =>
  getJson(
    "/v1/tokens/gldt/explorer/stats",
    z.object({
      holders: z.object({ total: z.number(), icp: z.number(), ethereum: z.number(), base: z.number(), evm: z.number() }),
      last_24h: z.object({ transactions: z.number(), volume: units }),
    })
  );

/** GLDT on each network, and what is between them. */
export const fetchBridgeSupply = () =>
  getJson(
    "/v1/tokens/gldt/bridge/supply",
    z.object({ icp: units, ethereum: units, base: units, total: units })
  );

/** Grams of gold that back the GLDT in circulation. */
export const fetchGoldBacking = async () =>
  (await getJson("/v1/tokens/gldt/gold/summary", z.object({ gldt_backing_grams: z.number() }))).gldt_backing_grams;
