import { useQuery, keepPreviousData } from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { ApiServiceErr } from "@services/_api/types/api.types";
import { ListParams } from "@services/_api/types/list.params.types";
import { TransactionResults } from "@services/_api/types/transactions.types";
import { LEDGER_CANISTER_ID } from "@constants/index";

const fn = async ({
  limit,
  offset,
}: ListParams): Promise<TransactionResults> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${LEDGER_CANISTER_ID}/transactions?limit=${limit}&offset=${offset}`
  );
  return {
    rows: data?.data ?? [],
    pageCount: data.total_transactions
      ? Math.ceil(data.total_transactions / limit)
      : 0,
    rowCount: data?.total_transactions ?? 0,
  };
};

const useFetchAllTransactions = ({ limit = 20, offset = 0 }: ListParams) => {
  return useQuery<TransactionResults, ApiServiceErr>({
    queryKey: ["fetchAllTransactions", limit, offset],
    queryFn: () => fn({ limit, offset }),
    placeholderData: keepPreviousData,
  });
};

export default useFetchAllTransactions;
