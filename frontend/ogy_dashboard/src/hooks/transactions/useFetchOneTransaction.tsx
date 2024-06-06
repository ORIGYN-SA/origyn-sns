import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { DateTime } from "luxon";
import _capitalize from "lodash/capitalize";
import { fetchOneTransaction } from "@services/queries/transactions/fetchOneTransaction";
import { fetchOneTransactionRosetta } from "@services/queries/transactions/fetchOneTransactionRosetta";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";

const useFetchOneTransaction = ({
  transactionId,
}: {
  transactionId: string;
}) => {
  const {
    data: transactionRosetta,
    isSuccess: isSuccessFetchOneTransactionRosetta,
    isError: isErrorFetchOneTransactionRosetta,
    // isLoading: isLoadingFetchOneTransactionRosetta,
    // error: errorFetchOneTransactionRosetta,
  } = useQuery({
    queryKey: ["fetchOneTransactionRosetta", transactionId],
    queryFn: () =>
      fetchOneTransactionRosetta({
        transactionId,
      }),
    enabled: !!transactionId,
    placeholderData: keepPreviousData,
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
      !!(
        !isSuccessFetchOneTransactionRosetta ||
        !isErrorFetchOneTransactionRosetta
      ),
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
      updated_at: updated_at
        ? DateTime.fromISO(updated_at).toLocaleString(DateTime.DATETIME_FULL)
        : "",
      memo: memo ? memo : "-",
    },
  };

  return {
    data,
    isLoading: isLoadingFetchOneTransaction,
    isSuccess: isSuccessFetchOneTransaction,
    isError: isErrorFetchOneTransaction,
    error: errorFetchOneTransaction,
  };
};

export default useFetchOneTransaction;
