import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { nftActor, type Collection } from "../icp/canisters";
import { useIcpSession } from "../icp/session";

/** What the app shows of a GLD NFT's metadata: the bar's serial number, pictures and specs. */
export type NftMeta = {
  serial: string | null;
  front: string | null;
  back: string | null;
  description: string | null;
  fineness: string | null;
  dimensions: string | null;
  hardness: string | null;
  manufacturer: string | null;
};

const EMPTY: NftMeta = {
  serial: null,
  front: null,
  back: null,
  description: null,
  fineness: null,
  dimensions: null,
  hardness: null,
  manufacturer: null,
};

/** The certificate JSON of a GLD NFT, as its collection stores it (JSON_DATA, or the document
 * icrc97:metadata points at). */
const certJson = z.object({
  serial_number: z.string().optional(),
  purity_fineness: z.string().optional(),
  dimensions: z.string().optional(),
  hardness: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  product_images: z.array(z.object({ id: z.string(), path: z.string() })).optional(),
});

const fromCert = (raw: unknown): NftMeta => {
  const c = certJson.safeParse(raw);
  if (!c.success) return EMPTY;
  const img = (prefix: string) => c.data.product_images?.find((x) => x.id.startsWith(prefix))?.path ?? null;
  return {
    serial: c.data.serial_number ?? null,
    front: img("front-") ?? c.data.image ?? null,
    back: img("back-"),
    description: c.data.description ?? null,
    fineness: c.data.purity_fineness ?? null,
    dimensions: c.data.dimensions ?? null,
    hardness: c.data.hardness ?? null,
    manufacturer: c.data.manufacturer ?? null,
  };
};

type Value = { Text: string } | { Array: Value[] } | Record<string, unknown>;
const text = (v: Value | undefined): string | null => (v && "Text" in v && typeof v.Text === "string" ? v.Text : null);

const fetchMeta = async (agent: Parameters<typeof nftActor>[0], c: Collection, id: bigint): Promise<NftMeta> => {
  const [entry] = await nftActor(agent, c).icrc7_token_metadata([id]);
  const fields = new Map<string, Value>(entry?.[0] ?? []);
  const inline = text(fields.get("JSON_DATA"));
  if (inline) return fromCert(JSON.parse(inline));
  const doc = fields.get("icrc97:metadata");
  const url = doc && "Array" in doc && Array.isArray(doc.Array) ? text(doc.Array[0]) : null;
  if (!url) return EMPTY;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NFT metadata ${url}: ${res.status}`);
  return fromCert(await res.json());
};

export const useNftMeta = (c: Collection, id: bigint) => {
  const s = useIcpSession();
  return useQuery({
    queryKey: ["nft-meta", c.key, String(id)],
    enabled: !!s,
    staleTime: Infinity,
    queryFn: () => {
      if (!s) throw new Error("no agent");
      return fetchMeta(s.anon, c, id);
    },
  });
};
