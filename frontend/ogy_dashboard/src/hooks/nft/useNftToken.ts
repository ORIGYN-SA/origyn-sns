import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { toNftCard, NftCard } from "./mapNft";

const useNftToken = (canisterId: string | null, tokenId: string | null) => {
  const query = useQuery({
    queryKey: ["NFT_TOKEN", canisterId, tokenId],
    queryFn: () =>
      gldtEndpoints.getNftToken(canisterId as string, tokenId as string),
    enabled: canisterId !== null && tokenId !== null,
  });

  const card: NftCard | null = useMemo(
    () => (query.data ? toNftCard(query.data) : null),
    [query.data]
  );

  return { ...query, card };
};

export default useNftToken;
