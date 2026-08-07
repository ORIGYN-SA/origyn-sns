import gldtAPI from "@services/api/gldt/v1";
import { gldtNftPath } from "@services/api/gldt/v1/utils";

export type NftEventType = "mint" | "transfer" | "burn";

export type NftTransactionSort = "-time" | "time";

// token_id is a Nat that can exceed 2^53, so it stays a string. from_account is
// null for mints, to_account for burns. tx_time is epoch ms.
export interface ApiNftTransaction {
  block_id: number;
  event_type: string;
  collection: string;
  collection_name?: string | null;
  token_id: string;
  from_account?: string | null;
  to_account?: string | null;
  tx_time: number;
  direction?: string | null;
}

export interface ApiNftTransactionsResponse {
  items: ApiNftTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface FetchNftTransactionsParams {
  account?: string;
  collection?: string;
  tokenId?: string;
  type?: NftEventType;
  sort?: NftTransactionSort;
  limit?: number;
  offset?: number;
}

const fetchNftTransactions = async ({
  account,
  collection,
  tokenId,
  type,
  sort,
  limit,
  offset,
}: FetchNftTransactionsParams = {}): Promise<ApiNftTransactionsResponse> => {
  const { data } = await gldtAPI.get<ApiNftTransactionsResponse>(
    gldtNftPath("transactions", {
      account,
      collection,
      token_id: tokenId,
      type,
      sort,
      limit,
      offset,
    })
  );
  return {
    ...data,
    items: data.items ?? [],
  };
};

export default fetchNftTransactions;
