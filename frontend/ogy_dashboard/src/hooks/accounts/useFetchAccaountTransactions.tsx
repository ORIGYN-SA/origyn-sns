import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchAccounttransactions, { TransactionsDetails } from "@services/queries/accounts/fetchAcoountTransactions";

const useFetchAccountTransactions = (accountPrincipal: string) => {
  const {
    data,
    isSuccess,
    isLoading,
    error,
  }: UseQueryResult<TransactionsDetails[]> = useQuery(fetchAccounttransactions({ accountPrincipal }));

  return { data, isSuccess, isLoading, isError: error };
};

export default useFetchAccountTransactions;
