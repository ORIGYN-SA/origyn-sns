import { useEffect, useState, SetStateAction } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchAccountBalanceICP from "@services/queries/accounts/fetchAccountBalanceICP";
import {
  ACCOUNT_ID_LEDGER_ICP,
  ACCOUNT_ID_LEDGER_ICP_OLD,
} from "@constants/index";
import { roundAndFormatLocale } from "@helpers/numbers";

const useFetchTreasuryAccountICP = () => {
  const [ledgerICPActor] = useCanister("ledgerICP");
  const [data, setData] = useState<SetStateAction<string | null>>(null);

  const {
    data: accountBalanceICP,
    isSuccess: isSuccessFetchLedgerAccountBalanceICP,
    isLoading: isLoadingFetchLedgerAccountBalanceICP,
    isError: isErrorFetchLedgerAccountBalanceICP,
    error: errorFetchLedgerAccountBalanceICP,
  } = useQuery({
    queryKey: ["fetchLedgerAccountBalanceICP"],
    queryFn: () =>
      fetchAccountBalanceICP({
        actor: ledgerICPActor,
        account: ACCOUNT_ID_LEDGER_ICP,
      }),
    placeholderData: keepPreviousData,
  });

  const {
    data: accountOldBalanceICP,
    isSuccess: isSuccessFetchLedgerOldAccountBalanceICP,
    isLoading: isLoadingFetchLedgerOldAccountBalanceICP,
    isError: isErrorFetchLedgerOldAccountBalanceICP,
    error: errorFetchLedgerOldAccountBalanceICP,
  } = useQuery({
    queryKey: ["fetchLedgerOldAccountBalanceICP"],
    queryFn: () =>
      fetchAccountBalanceICP({
        actor: ledgerICPActor,
        account: ACCOUNT_ID_LEDGER_ICP_OLD,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (
      isSuccessFetchLedgerAccountBalanceICP &&
      isSuccessFetchLedgerOldAccountBalanceICP
    ) {
      setData(
        roundAndFormatLocale({
          number: accountBalanceICP + accountOldBalanceICP,
        })
      );
    }
  }, [
    isSuccessFetchLedgerAccountBalanceICP,
    isSuccessFetchLedgerOldAccountBalanceICP,
    accountBalanceICP,
    accountOldBalanceICP,
  ]);

  return {
    data,
    isSuccess:
      isSuccessFetchLedgerAccountBalanceICP &&
      isSuccessFetchLedgerOldAccountBalanceICP,
    isLoading:
      isLoadingFetchLedgerAccountBalanceICP ||
      isLoadingFetchLedgerOldAccountBalanceICP,
    isError:
      isErrorFetchLedgerAccountBalanceICP ||
      isErrorFetchLedgerOldAccountBalanceICP,
    error:
      errorFetchLedgerAccountBalanceICP || errorFetchLedgerOldAccountBalanceICP,
  };
};

export default useFetchTreasuryAccountICP;
