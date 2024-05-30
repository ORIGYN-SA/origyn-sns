import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchAllTransactions } from "@services/queries/transactions/fetchAllTransactions";
import { ListParams } from "@services/types/list.params.types";
import { timestampToDateShort } from "@helpers/dates";

const useFetchAllTransactions = ({
  limit = 20,
  offset = 0,
  sorting = [{ id: "index", desc: true }],
}: ListParams) => {
  const {
    data: transactions,
    isSuccess: isSuccessFetchAllTransactions,
    isError: isErrorFetchAllTransactions,
    isLoading: isLoadingFetchAllTransactions,
    error: errorFetchAllTransactions,
  } = useQuery({
    queryKey: ["fetchAllTransactions", limit, offset, sorting],
    queryFn: () => fetchAllTransactions({ limit, offset, sorting }),
    placeholderData: keepPreviousData,
  });

  const rows = isSuccessFetchAllTransactions
    ? transactions.data?.map((transaction) => {
        const index = transaction?.index;
        const timestamp = transaction?.timestamp;
        // const updated_at = transaction?.updated_at;
        const from_account = transaction?.from_account;
        const to_account = transaction?.to_account;
        const amount = transaction?.amount;
        const fee = transaction?.fee;
        const memo = transaction?.memo;
        const kind = transaction?.kind;

        return {
          index,
          timestamp: timestamp ? timestampToDateShort(Number(timestamp)) : "",
          from_account: kind === "mint" ? "Minting account" : from_account,
          to_account,
          amount,
          fee,
          memo,
          kind,
        };
      })
    : [];

  const totalTransactions = transactions?.total_transactions ?? 0;

  return {
    data: {
      list: {
        rows,
        pageCount: totalTransactions ? Math.ceil(totalTransactions / limit) : 0,
        rowCount: totalTransactions,
      },
    },
    isLoading: isLoadingFetchAllTransactions,
    isSuccess: isSuccessFetchAllTransactions,
    isError: isErrorFetchAllTransactions,
    error: errorFetchAllTransactions,
  };
};

export default useFetchAllTransactions;
