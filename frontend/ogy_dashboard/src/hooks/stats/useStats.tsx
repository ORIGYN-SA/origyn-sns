// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import useConnect from "@hooks/useConnect";
import fetchBalanceOGY from "@services/queries/accounts/fetchBalanceOGY";

const useFetchBalanceOGYOwner = () => {
  const { principal: owner, isConnected } = useConnect();
  const [ledgerActor] = useCanister("ledger");

  return useQuery({
    queryKey: ["userFetchBalanceOGY", owner, isConnected],
    queryFn: () =>
      fetchBalanceOGY({ actor: ledgerActor, owner: owner as string }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceOGYOwner;
