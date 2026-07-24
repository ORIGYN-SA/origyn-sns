import { useQuery } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { HttpError } from "@services/api/httpClient";

const FIVE_MINUTES = 5 * 60 * 1000;

const fetchCollectionOrNull = async (canisterId: string) => {
  try {
    return await gldtEndpoints.getNftCollection(canisterId);
  } catch (error) {
    if ((error as HttpError | null)?.status === 404) return null;
    throw error;
  }
};

export const collectionQueryOptions = (canisterId: string) => ({
  queryKey: ["NFT_COLLECTION", canisterId],
  queryFn: () => fetchCollectionOrNull(canisterId),
  staleTime: FIVE_MINUTES,
});

const useNftCollection = (canisterId: string | null) =>
  useQuery({
    ...collectionQueryOptions(canisterId ?? ""),
    enabled: canisterId !== null,
  });

export default useNftCollection;
