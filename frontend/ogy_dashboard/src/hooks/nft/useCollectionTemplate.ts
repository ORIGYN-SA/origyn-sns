import { useQuery } from "@tanstack/react-query";
import fetchCollectionTemplate from "@services/queries/nft/fetchCollectionTemplate";

const TEN_MINUTES = 10 * 60 * 1000;

// Null results are cached so template-less collections are not refetched.
const useCollectionTemplate = (collectionCanisterId: string | null) =>
  useQuery({
    queryKey: ["NFT_COLLECTION_TEMPLATE", collectionCanisterId],
    queryFn: () => fetchCollectionTemplate(collectionCanisterId as string),
    enabled: collectionCanisterId !== null,
    staleTime: TEN_MINUTES,
    retry: 1,
  });

export default useCollectionTemplate;
