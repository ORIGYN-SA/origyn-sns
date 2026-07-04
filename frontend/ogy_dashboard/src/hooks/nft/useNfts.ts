import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchNfts, { FetchNftsParams } from "@services/queries/nft/fetchNfts";
import { toNftCard, NftCard } from "./mapNft";

const ONE_MINUTE = 60 * 1000;

const useNfts = (params: FetchNftsParams = {}) => {
  const query = useQuery({
    queryKey: ["NFTS", params],
    queryFn: () => fetchNfts(params),
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  const cards: NftCard[] = useMemo(
    () => (query.data ?? []).map(toNftCard),
    [query.data]
  );

  return { ...query, cards };
};

export default useNfts;
