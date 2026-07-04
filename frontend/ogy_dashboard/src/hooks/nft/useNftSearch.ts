import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchNftSearch from "@services/queries/nft/fetchNftSearch";
import { toNftCard, NftCard } from "./mapNft";

const useNftSearch = (query: string) => {
  const q = query.trim();
  const enabled = q.length > 0;

  const result = useQuery({
    queryKey: ["NFT_SEARCH", q],
    queryFn: () => fetchNftSearch({ q }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const cards: NftCard[] = useMemo(
    () => (result.data?.nfts ?? []).map(toNftCard),
    [result.data]
  );

  return {
    ...result,
    cards,
    collections: result.data?.collections ?? [],
    accounts: result.data?.accounts ?? [],
  };
};

export default useNftSearch;
