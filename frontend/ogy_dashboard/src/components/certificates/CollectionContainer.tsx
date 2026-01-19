import { useQuery } from "@tanstack/react-query";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory as origynIdlFactory } from "@services/candid/origyn_nft_reference";
import { idlFactory as icrc7IdlFactory } from "@services/candid/icrc7_nft";
import { isLegacyOrigynCollection } from "@constants/index";
import { CollectionCard } from "./CollectionCard";

type CollectionContainerProps = {
  canisterId: string;
};

type CollectionData = {
  name: string | undefined;
  logo: string | undefined;
  nftCount: number;
};

const computeLogoUrl = (canisterId: string, logoFileName: string): string => {
  return `https://${canisterId}.raw.icp0.io/collection/-/${logoFileName}`;
};

const agent = new HttpAgent({
  host: "https://icp-api.io",
});

const fetchOrigynCollection = async (
  canisterId: string
): Promise<CollectionData> => {
  const actor = Actor.createActor(origynIdlFactory, {
    agent,
    canisterId: Principal.fromText(canisterId),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await actor.collection_nft_origyn([]);
  const data = response.ok;

  return {
    name: data?.name?.[0],
    logo: data?.logo?.[0],
    nftCount: parseInt(data?.token_ids_count?.[0] ?? 0),
  };
};

const fetchIcrc7Collection = async (
  canisterId: string
): Promise<CollectionData> => {
  const actor = Actor.createActor(icrc7IdlFactory, {
    agent,
    canisterId: Principal.fromText(canisterId),
  });

  // Fetch collection metadata in parallel
  const [name, logo, totalSupply] = await Promise.all([
    actor.icrc7_name() as Promise<string>,
    actor.icrc7_logo() as Promise<[] | [string]>,
    actor.icrc7_total_supply() as Promise<bigint>,
  ]);

  return {
    name,
    logo: Array.isArray(logo) && logo.length > 0 ? logo[0] : undefined,
    nftCount: Number(totalSupply),
  };
};

export const CollectionContainer = ({
  canisterId,
}: CollectionContainerProps) => {
  const isLegacy = isLegacyOrigynCollection(canisterId);

  const { data: collectionData, isLoading } = useQuery({
    queryKey: ["collection", canisterId, isLegacy ? "origyn" : "icrc7"],
    queryFn: () =>
      isLegacy
        ? fetchOrigynCollection(canisterId)
        : fetchIcrc7Collection(canisterId),
  });

  if (isLoading) {
    return <CollectionCard.Skeleton />;
  }

  let logo = collectionData?.logo;
  // For ORIGYN collections, construct the full URL if it's not a data URI
  if (isLegacy && logo && !logo.startsWith("data:image")) {
    logo = computeLogoUrl(canisterId, logo);
  }

  return (
    <CollectionCard
      name={collectionData?.name ?? "Unknown Collection"}
      canisterId={canisterId}
      nftCount={collectionData?.nftCount ?? 0}
      imageUrl={logo || "/col_placeholder_logo.jpg"}
      isLegacy={isLegacy}
    />
  );
};
