import { useQuery } from "@tanstack/react-query";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { CollectionCard } from "./CollectionCard";
import { LoaderSpin } from "@components/ui";
import { idlFactory } from "@services/candid/origyn_nft_reference";

type CollectionContainerProps = {
  canisterId: string;
};

const computeLogoUrl = (canisterId: string, logoFileName: string): string => {
  return `https://${canisterId}.raw.icp0.io/collection/-/${logoFileName}`;
};

const agent = new HttpAgent({
  host: "https://icp-api.io",
});

export const CollectionContainer = ({
  canisterId,
}: CollectionContainerProps) => {
  const { data: collectionData, isLoading } = useQuery({
    queryKey: ["collection", canisterId],
    queryFn: async () => {
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: Principal.fromText(canisterId),
      });

      const response = await actor.collection_nft_origyn([]);
      console.log("🚀 ~ queryFn: ~ response:", response);
      return response.ok;
    },
  });
  console.log("🚀 ~ collectionData:", collectionData);

  if (isLoading) {
    return <LoaderSpin />;
  }

  let logo = collectionData?.logo[0];
  if (logo && !logo?.startsWith("data:image"))
    logo = computeLogoUrl(canisterId, logo);

  return (
    <CollectionCard
      name={collectionData?.ok?.name[0]}
      canisterId={canisterId}
      nftCount={parseInt(collectionData?.token_ids_count?.[0] ?? 0)}
      imageUrl={logo}
    />
  );
};
