import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { NftListParams } from "@origyn/shared-ui/gldt";
import { collectionNamesById, toNftCard, NftCard } from "./mapNft";

const ONE_MINUTE = 60 * 1000;

const useNftsPage = (params: NftListParams = {}) => {
  const query = useQuery({
    queryKey: ["NFTS_PAGE", params],
    queryFn: () => gldtEndpoints.getNfts(params),
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  const cards: NftCard[] = useMemo(() => {
    const names = collectionNamesById(query.data?.collections);
    return (query.data?.items ?? []).map((nft) => toNftCard(nft, names));
  }, [query.data]);

  return { ...query, cards, total: query.data?.total ?? 0 };
};

export default useNftsPage;
