import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { NftListParams } from "@origyn/shared/gldt";
import { toNftCard, NftCard } from "./mapNft";

const ONE_MINUTE = 60 * 1000;

// Paginated variant of useNfts: exposes the page total for grid pagination.
const useNftsPage = (params: NftListParams = {}) => {
  const query = useQuery({
    queryKey: ["NFTS_PAGE", params],
    queryFn: () => gldtEndpoints.getNfts(params),
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  const cards: NftCard[] = useMemo(
    () => (query.data?.items ?? []).map(toNftCard),
    [query.data]
  );

  return { ...query, cards, total: query.data?.total ?? 0 };
};

export default useNftsPage;
