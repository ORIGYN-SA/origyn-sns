import { useQuery } from "@tanstack/react-query";
import fetchCollectionTemplate from "@services/queries/nft/fetchCollectionTemplate";
import useNftCollection from "./useNftCollection";

const TEN_MINUTES = 10 * 60 * 1000;

const useCollectionTemplate = (collectionCanisterId: string | null) => {
  const collection = useNftCollection(collectionCanisterId);
  const templateUrl = collection.data?.template_url ?? null;

  const template = useQuery({
    queryKey: ["NFT_COLLECTION_TEMPLATE", templateUrl],
    queryFn: () => fetchCollectionTemplate(templateUrl as string),
    enabled: templateUrl !== null,
    staleTime: TEN_MINUTES,
    retry: 1,
  });

  return {
    data: template.data ?? null,
    isLoading:
      collection.isLoading || (templateUrl !== null && template.isLoading),
  };
};

export default useCollectionTemplate;
