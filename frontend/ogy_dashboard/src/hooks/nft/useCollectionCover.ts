import { useQuery } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";

const THIRTY_MINUTES = 30 * 60 * 1000;

// Some collections have no logo set in the minting studio; fall back to the
// image of their first NFT. The extra request only fires for those.
const useCollectionCover = (
  canisterId: string,
  logo: string | null
): string | null => {
  const query = useQuery({
    queryKey: ["NFT_COLLECTION_COVER", canisterId],
    queryFn: async () => {
      const { items } = await gldtEndpoints.getNfts({
        collection: canisterId,
        limit: 1,
        metadata: false,
      });
      return items[0]?.image_url ?? null;
    },
    enabled: logo === null,
    staleTime: THIRTY_MINUTES,
  });

  return logo ?? query.data ?? null;
};

export default useCollectionCover;
