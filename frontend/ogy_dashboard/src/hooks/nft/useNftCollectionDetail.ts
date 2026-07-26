import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import useNftCollection from "./useNftCollection";

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

export const useNftCollectionHolders = (
  canisterId: string,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}
) => {
  const query = useQuery({
    queryKey: ["NFT_COLLECTION_HOLDERS", canisterId, limit, offset],
    queryFn: () =>
      gldtEndpoints.getNftCollectionHolders(canisterId, { limit, offset }),
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
  };
};

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
