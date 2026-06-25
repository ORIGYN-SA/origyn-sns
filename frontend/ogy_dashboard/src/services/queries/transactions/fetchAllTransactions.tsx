import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import { ApiTransactionsResponse } from "@services/api/gldt/v1/types";
import { ListParams } from "@services/types/list.params.types";
import { Transaction } from "@services/types/transactions.types";
import {
  buildTransactionsSort,
  mapApiTransaction,
} from "@services/queries/transactions/utils";

export const fetchAllTransactions = async ({
  limit,
  offset,
  sorting,
}: ListParams): Promise<{
  data: Transaction[];
  total_transactions: number;
}> => {
  const { data } = await gldtAPI.get<ApiTransactionsResponse>(
    gldtTokenPath("transactions", {
      limit,
      offset,
      sort_by: buildTransactionsSort(sorting) || undefined,
    })
  );
  return {
    data: data.data.map(mapApiTransaction),
    total_transactions: data.total_count,
  };
};
