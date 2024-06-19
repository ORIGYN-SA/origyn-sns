import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchOneAccountTransactions from "@services/queries/transactions/fetchOneAccountTransactions";
import { ListParams } from "@services/types/list.params.types";
import { formatDate } from "@helpers/dates";

const useFetchOneAccountTransactions = ({
  limit = 10,
  offset = 0,
  sorting = [{ id: "index", desc: true }],
  accountId,
}: ListParams & { accountId: string }) => {
  const {
    data: transactions,
    isSuccess: isSuccessFetchAllTransactions,
    isError: isErrorFetchAllTransactions,
    isLoading: isLoadingFetchAllTransactions,
    error: errorFetchAllTransactions,
  } = useQuery({
    queryKey: [
      "fetchOneAccountTransactions",
      limit,
      offset,
      sorting,
      accountId,
    ],
    queryFn: () =>
      fetchOneAccountTransactions({ limit, offset, sorting, accountId }),
    placeholderData: keepPreviousData,
  });

  const rows = isSuccessFetchAllTransactions
    ? transactions.data?.map((transaction) => {
        const index = transaction?.index;
        const timestamp = transaction?.timestamp;
        const from_account = transaction?.from_account;
        const to_account = transaction?.to_account;
        const amount = transaction?.amount;
        const fee = transaction?.fee;
        const memo = transaction?.memo;
        const kind = transaction?.kind;

        return {
          index,
          timestamp: timestamp
            ? formatDate(timestamp, { fromMillis: true })
            : "",
          from_account: kind === "mint" ? "Minting account" : from_account,
          to_account: kind === "burn" ? "Minting account" : to_account,
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

export default useFetchOneAccountTransactions;
