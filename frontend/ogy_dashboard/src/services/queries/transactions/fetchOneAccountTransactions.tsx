import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import { ApiTransactionsResponse } from "@services/api/gldt/v1/types";
import { ListParams } from "@services/types/list.params.types";
import { Transaction } from "@services/types/transactions.types";
import {
  buildTransactionsSort,
  mapApiTransaction,
} from "@services/queries/transactions/utils";
import { toOracleAccount } from "@helpers/principal";

const fetchOneAccountTransactions = async ({
  limit,
  offset,
  sorting,
  accountId,
}: ListParams & { accountId: string }): Promise<{
  data: Transaction[];
  total_transactions: number;
}> => {
  const { data } = await gldtAPI.get<ApiTransactionsResponse>(
    gldtTokenPath("transactions", {
      limit,
      offset,
      account: toOracleAccount(accountId),
      sort_by: buildTransactionsSort(sorting) || undefined,
    })
  );
  return {
    data: data.data.map(mapApiTransaction),
    total_transactions: data.total_count,
  };
};

export default fetchOneAccountTransactions;
