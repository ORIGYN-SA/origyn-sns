import fetchNftTransactions, {
  ApiNftTransaction,
} from "./fetchNftTransactions";

const PAGE_SIZE = 100;

export interface FetchNftTransactionParams {
  collection: string;
  tokenId: string;
  blockId: number;
}

const fetchNftTransaction = async ({
  collection,
  tokenId,
  blockId,
}: FetchNftTransactionParams): Promise<ApiNftTransaction | null> => {
  let offset = 0;

  for (;;) {
    const { items, total } = await fetchNftTransactions({
      collection,
      tokenId,
      limit: PAGE_SIZE,
      offset,
    });

    if (items.length === 0) return null;

    const match = items.find((item) => item.block_id === blockId);
    if (match) return match;

    offset += items.length;
    if (offset >= total) return null;
  }
};

export default fetchNftTransaction;
