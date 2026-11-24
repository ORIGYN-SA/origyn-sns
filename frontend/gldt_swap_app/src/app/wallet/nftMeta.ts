import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { nftActor, type Collection } from "../icp/canisters";
import { useIcpSession } from "../icp/session";

/** What the app shows of a GLD NFT's metadata: the bar's serial number and its pictures. */
export type NftMeta = { serial: string | null; front: string | null; back: string | null; description: string | null };

const metaJson = z.object({
  description: z.string().optional(),
  image: z.string().optional(),
  attributes: z.array(z.object({ trait_type: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
});

/** The NFT's metadata: icrc7_token_metadata points at a JSON document, whose attributes hold the
 * serial number and the front and back pictures. */
const fetchMeta = async (agent: Parameters<typeof nftActor>[0], c: Collection, id: bigint): Promise<NftMeta> => {
  const [entry] = await nftActor(agent, c).icrc7_token_metadata([id]);
  const first = entry?.[0]?.[0]?.[1];
  const url = first && "Array" in first && first.Array[0] && "Text" in first.Array[0] ? first.Array[0].Text : null;
  if (!url) return { serial: null, front: null, back: null, description: null };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NFT metadata ${url}: ${res.status}`);
  const json = metaJson.parse(await res.json());
  const attr = (pred: (t: string) => boolean) => {
    const a = json.attributes?.find((x) => pred(x.trait_type));
    return a === undefined ? null : String(a.value);
  };
  return {
    serial: attr((t) => t === "Serial Number"),
    front: attr((t) => t.startsWith("front-")) ?? json.image ?? null,
    back: attr((t) => t.startsWith("back-")),
    description: json.description ?? null,
  };
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
