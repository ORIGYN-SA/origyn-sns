import { skipToken, useQuery } from "@tanstack/react-query";
import fetchNftTransaction from "@services/queries/nft/fetchNftTransaction";

const ONE_MINUTE = 60 * 1000;

type UseNftTransactionParams = {
  collection: string | null;
  tokenId: string | null;
  blockId: number | null;
};

const useNftTransaction = ({
  collection,
  tokenId,
  blockId,
}: UseNftTransactionParams) => {
  const params =
    collection !== null && tokenId !== null && blockId !== null
      ? { collection, tokenId, blockId }
      : null;

  const query = useQuery({
    queryKey: ["NFT_TRANSACTION", collection, tokenId, blockId],
    queryFn: params ? () => fetchNftTransaction(params) : skipToken,
    staleTime: ONE_MINUTE,
  });

  return { ...query, transaction: query.data ?? null };
};

export default useNftTransaction;
