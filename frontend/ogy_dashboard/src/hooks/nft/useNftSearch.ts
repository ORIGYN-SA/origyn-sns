import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchNftSearch from "@services/queries/nft/fetchNftSearch";
import { collectionNamesById, toNftCard, NftCard } from "./mapNft";

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

  // Search returns collection hits for the query, not a join table for the
  // nft hits, so names only resolve when the nft's collection also matched.
  const cards: NftCard[] = useMemo(() => {
    const names = collectionNamesById(result.data?.collections);
    return (result.data?.nfts ?? []).map((nft) => toNftCard(nft, names));
  }, [result.data]);

  return {
    ...result,
    cards,
    collections: result.data?.collections ?? [],
    accounts: result.data?.accounts ?? [],
  };
};

export default useNftSearch;
