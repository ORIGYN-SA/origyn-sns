import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";

const FIVE_MINUTES = 5 * 60 * 1000;

const useNftCollections = (
  params: { category?: string; limit?: number; offset?: number } = {}
) =>
  useQuery({
    queryKey: ["NFT_COLLECTIONS", params],
    queryFn: () => gldtEndpoints.getNftCollections(params),
    placeholderData: keepPreviousData,
    staleTime: FIVE_MINUTES,
  });

export default useNftCollections;
