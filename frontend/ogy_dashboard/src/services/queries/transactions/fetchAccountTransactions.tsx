import { useQuery, keepPreviousData } from "@tanstack/react-query";
import icrcAPI from "@services/api/icrc/v1";
import { ApiServiceErr } from "@services/types/api.types";
import { SortingState } from "@tanstack/react-table";
import { TransactionResults } from "@services/types/transactions.types";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export interface ListParams {
  account: string,
  limit: number;
  offset: number;
  sorting: SortingState;
}

const fn = async ({
  account,
  limit,
  offset,
  sorting,
}: ListParams): Promise<TransactionResults> => {
  const { id, desc } = sorting[0];
  const sort = desc ? `&sort_by=-${id}` : `&sort_by=${id}`;
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/accounts/${account}/transactions?limit=${limit}&offset=${offset}${sort}`
  );
  return {
    rows: data?.data ?? [],
    pageCount: data.total_transactions
      ? Math.ceil(data.total_transactions / limit)
      : 0,
    rowCount: data?.total_transactions ?? 0,
  };
};

const useFetchAccountTransactions = ({
  account,
  limit = 20,
  offset = 0,
  sorting = [{ id: "index", desc: true }],
}: ListParams) => {
  return useQuery<TransactionResults, ApiServiceErr>({
    queryKey: ["fetchAccountTransactions", limit, offset, sorting],
    queryFn: () => fn({ account, limit, offset, sorting }),
    placeholderData: keepPreviousData,
  });
};

export default useFetchAccountTransactions;
