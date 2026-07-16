import { useQuery } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";

const FIVE_MINUTES = 5 * 60 * 1000;

// Shares its cache entry with useNftCollectionDetail via the query key.
const useNftCollection = (canisterId: string) =>
  useQuery({
    queryKey: ["NFT_COLLECTION", canisterId],
    queryFn: () => gldtEndpoints.getNftCollection(canisterId),
    staleTime: FIVE_MINUTES,
  });

export default useNftCollection;
