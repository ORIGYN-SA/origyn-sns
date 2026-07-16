import { useQuery } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import useNftCollection from "./useNftCollection";

const FIVE_MINUTES = 5 * 60 * 1000;

const useNftCollectionDetail = (canisterId: string) => {
  const collection = useNftCollection(canisterId);

  const stats = useQuery({
    queryKey: ["NFT_COLLECTION_STATS", canisterId],
    queryFn: () => gldtEndpoints.getNftCollectionStats(canisterId),
    staleTime: FIVE_MINUTES,
  });

  return { collection, stats };
};

export default useNftCollectionDetail;
