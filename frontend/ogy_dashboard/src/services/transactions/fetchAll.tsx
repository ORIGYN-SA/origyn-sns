import { useQuery, keepPreviousData } from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { ApiServiceErr } from "@services/_api/types/api.types";
import { ListParams } from "@services/_api/types/list.params.types";
import { TransactionResults } from "@services/_api/types/transactions.types";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

const fn = async ({
  limit,
  offset,
  sorting,
}: ListParams): Promise<TransactionResults> => {
  const { id, desc } = sorting[0];
  const sort = desc ? `&sort_by=-${id}` : `&sort_by=${id}`;
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/transactions?limit=${limit}&offset=${offset}${sort}`
  );
  return {
    rows: data?.data ?? [],
    pageCount: data.total_transactions
      ? Math.ceil(data.total_transactions / limit)
      : 0,
    rowCount: data?.total_transactions ?? 0,
  };
};

const useFetchAllTransactions = ({
  limit = 20,
  offset = 0,
  sorting = [{ id: "index", desc: true }],
}: ListParams) => {
  return useQuery<TransactionResults, ApiServiceErr>({
    queryKey: ["fetchAllTransactions", limit, offset, sorting],
    queryFn: () => fn({ limit, offset, sorting }),
    placeholderData: keepPreviousData,
  });
};

export default useFetchAllTransactions;
