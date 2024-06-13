import { useEffect, useState, SetStateAction } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchAccountBalanceOGY from "@services/queries/accounts/fetchAccountBalanceOGY";
import { ACCOUNT_ID_LEDGER_OGY } from "@constants/index";
import { roundAndFormatLocale } from "@helpers/numbers";

const useFetchTreasuryAccountOGY = () => {
  const [ledgerLegacyActor] = useCanister("ledgerLegacy");
  const [data, setData] = useState<SetStateAction<string | null>>(null);

  const {
    data: accountBalanceOGY,
    isSuccess: isSuccessFetchLedgerAccountBalanceOGY,
    isLoading: isLoadingFetchLedgerAccountBalanceOGY,
    isError: isErrorFetchLedgerAccountBalanceOGY,
    error: errorFetchLedgerAccountBalanceOGY,
  } = useQuery({
    queryKey: ["fetchLedgerAccountBalanceOGY"],
    queryFn: () =>
      fetchAccountBalanceOGY({
        actor: ledgerLegacyActor,
        account: ACCOUNT_ID_LEDGER_OGY,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccessFetchLedgerAccountBalanceOGY) {
      setData(
        roundAndFormatLocale({
          number: accountBalanceOGY,
        })
      );
    }
  }, [isSuccessFetchLedgerAccountBalanceOGY, accountBalanceOGY]);

  return {
    data,
    isSuccess: isSuccessFetchLedgerAccountBalanceOGY,
    isLoading: isLoadingFetchLedgerAccountBalanceOGY,
    isError: isErrorFetchLedgerAccountBalanceOGY,
    error: errorFetchLedgerAccountBalanceOGY,
  };
};

export default useFetchTreasuryAccountOGY;
