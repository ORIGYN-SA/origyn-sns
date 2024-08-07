import { useQuery, keepPreviousData } from "@tanstack/react-query";
import _capitalize from "lodash/capitalize";
import { fetchOneTransaction } from "@services/queries/transactions/fetchOneTransaction";
import { fetchOneTransaction as fetchOneTransactionRosetta } from "@hooks/rosetta-api/queries";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { formatDate } from "@helpers/dates";

const useFetchOneTransaction = ({
  transactionId,
}: {
  transactionId: string;
}) => {
  const {
    data: transactionRosetta,
    isLoading: isLoadingFetchOneTransactionRosetta,
    isSuccess: isSuccessFetchOneTransactionRosetta,
    isError: isErrorFetchOneTransactionRosetta,
  } = useQuery({
    queryKey: ["fetchOneTransactionRosetta", transactionId],
    queryFn: () =>
      fetchOneTransactionRosetta({
        transactionId,
      }),
    enabled: !!transactionId,
    placeholderData: keepPreviousData,
    retry: 0,
  });

  const {
    data: transaction,
    isSuccess: isSuccessFetchOneTransaction,
    isError: isErrorFetchOneTransaction,
    isLoading: isLoadingFetchOneTransaction,
    error: errorFetchOneTransaction,
  } = useQuery({
    queryKey: ["fetchOneTransaction", transactionId],
    queryFn: () =>
      fetchOneTransaction({
        transactionId: transactionRosetta || transactionId,
      }),
    enabled:
      !!transactionId &&
      (!!isSuccessFetchOneTransactionRosetta ||
        !!isErrorFetchOneTransactionRosetta),
    placeholderData: keepPreviousData,
  });

  const index = transaction?.index;
  const updated_at = transaction?.updated_at;
  const from_account = transaction?.from_account;
  const to_account = transaction?.to_account;
  const amount = transaction?.amount;
  const fee = transaction?.fee;
  const memo = transaction?.memo;
  const kind = transaction?.kind;

  const data = {
    index,
    updated_at,
    from_account,
    to_account,
    amount,
    fee,
    memo,
    kind,
    formatted: {
      amount: amount
        ? roundAndFormatLocale({ number: divideBy1e8(Number(amount)) })
        : "",
      fee: fee
        ? roundAndFormatLocale({
            number: divideBy1e8(Number(fee)),
            decimals: 3,
          })
        : "",
      kind: _capitalize(kind),
      updated_at: updated_at ? formatDate(updated_at, { fromISO: true }) : "",
      memo: memo ? memo : "-",
    },
  };

  return {
    data,
    isLoading:
      isLoadingFetchOneTransaction || isLoadingFetchOneTransactionRosetta,
    isSuccess:
      isSuccessFetchOneTransaction && !isLoadingFetchOneTransactionRosetta,
    isError: isErrorFetchOneTransaction,
    error: errorFetchOneTransaction,
  };
};

export default useFetchOneTransaction;
