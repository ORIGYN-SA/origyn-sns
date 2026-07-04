import { useQuery } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";

const FIVE_MINUTES = 5 * 60 * 1000;

const useNftCollectionDetail = (canisterId: string) => {
  const collection = useQuery({
    queryKey: ["NFT_COLLECTION", canisterId],
    queryFn: () => gldtEndpoints.getNftCollection(canisterId),
    staleTime: FIVE_MINUTES,
  });

  const stats = useQuery({
    queryKey: ["NFT_COLLECTION_STATS", canisterId],
    queryFn: () => gldtEndpoints.getNftCollectionStats(canisterId),
    staleTime: FIVE_MINUTES,
  });

  return { collection, stats };
};

export default useNftCollectionDetail;
