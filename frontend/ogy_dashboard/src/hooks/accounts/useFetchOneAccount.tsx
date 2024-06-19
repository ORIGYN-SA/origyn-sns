import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchOneAccount } from "@services/queries/accounts/fetchOneAccount";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { DateTime } from "luxon";

const useFetchOneAccount = ({ accountId }: { accountId: string }) => {
  const {
    data: account,
    isSuccess: isSuccessFetchOneAccount,
    isError: isErrorFetchOneAccount,
    isLoading: isLoadingFetchOneAccount,
    error: errorFetchOneAccount,
  } = useQuery({
    queryKey: ["fetchOneAccount", accountId],
    queryFn: () =>
      fetchOneAccount({
        accountId,
      }),
    enabled: !!accountId,
    placeholderData: keepPreviousData,
  });

  const id = account?.id;
  const owner = account?.owner;
  const subaccount = account?.subaccount;
  const balance = account?.balance;
  const total_transactions = account?.total_transactions;
  const created_timestamp = account?.created_timestamp;
  const latest_transaction_index = account?.latest_transaction_index;
  const updated_at = account?.updated_at;
  const has_subaccount =
    subaccount !== "" && subaccount !== null && subaccount !== undefined;

  const data = {
    id,
    owner,
    subaccount,
    balance,
    total_transactions,
    created_timestamp,
    latest_transaction_index,
    updated_at,
    has_subaccount,
    formatted: {
      balance: balance
        ? roundAndFormatLocale({ number: divideBy1e8(Number(balance)) })
        : "",
      updated_at: updated_at
        ? DateTime.fromISO(updated_at).toLocaleString(DateTime.DATETIME_FULL)
        : "",
      subaccount: has_subaccount ? subaccount : "None (default subaccount)",
    },
  };

  return {
    data,
    isLoading: isLoadingFetchOneAccount,
    isSuccess: isSuccessFetchOneAccount,
    isError: isErrorFetchOneAccount,
    error: errorFetchOneAccount,
  };
};

export default useFetchOneAccount;
