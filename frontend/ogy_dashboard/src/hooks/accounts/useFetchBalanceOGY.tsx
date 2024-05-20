import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import fetchBalanceOGY from "@services/queries/accounts/fetchBalanceOGY";

const useFetchBalanceOGY = ({
  owner,
  subaccount,
}: {
  owner: string;
  subaccount: string;
}) => {
  const [ledgerActor] = useCanister("ledger");

  return useQuery({
    queryKey: ["userFetchBalanceOGY", owner, subaccount],
    queryFn: () => fetchBalanceOGY({ actor: ledgerActor, owner, subaccount }),
    placeholderData: keepPreviousData,
  });
};

export default useFetchBalanceOGY;
