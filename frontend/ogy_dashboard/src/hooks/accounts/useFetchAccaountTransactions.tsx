import { useState, useEffect } from "react";
import { useQuery, UseQueryResult, QueryClient } from "@tanstack/react-query";
import fetchAccounttransactions, { AccountTransactionsParams } from "@services/queries/accounts/fetchAcoountTransactions";
import fetchOneAccountQuery, {
  Account,
  AccountParams,
} from "@services/queries/accounts/fetchOneAccountQuery";
import { useLoaderData } from "react-router-dom";


const loader =
  (queryClient: QueryClient) =>
    async ({ params }: { params: AccountParams }) => {
      const query = fetchOneAccountQuery({ id: params.id });
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    };

const useFetchAccountTransactions = (accountPrincipal: string) => {
  const [data, setData] = useState({
    accountTransactions: null,
    accountData: null,
  });

  const initialData = useLoaderData() as Awaited<
    ReturnType<ReturnType<typeof loader>>
  >;

  const {
    data: transactionsData,
    isSuccess: isTransactionsSuccess,
    isLoading: isTransactionsLoading,
    error: isTransactionsError,
  }: UseQueryResult<AccountTransactionsParams> = useQuery(fetchAccounttransactions({ accountPrincipal }));

  const {
    data: oneAccountData,
    isError: isoOneAccountError,
    isLoading: isOneAccountLoading,
    isSuccess: isOneAccountSuccess,
  }: UseQueryResult<Account> = useQuery({
    ...fetchOneAccountQuery({ id: accountPrincipal }),
    initialData
  });
  
  useEffect(() => {
    if (isTransactionsSuccess && isOneAccountSuccess) {
      setData({
        accountTransactions: transactionsData,
        accountData: oneAccountData,
      });
    }
  }, [
    isTransactionsSuccess,
    isOneAccountSuccess,
    transactionsData,
    oneAccountData,
  ]);

  const isSuccess =
    isTransactionsSuccess && isOneAccountSuccess;
  const isLoading =
    isOneAccountLoading || isTransactionsLoading;
  const isError = isoOneAccountError || isTransactionsError;

  return { data, isSuccess, isLoading, isError };
};

export default useFetchAccountTransactions;
