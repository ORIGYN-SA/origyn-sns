// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import fetchBalanceOGYLegacy from "@services/queries/accounts/fetchBalanceOGYLegacy";

const useFetchBalanceOGYOwner = () => {
  const { principal: owner, isConnected } = useConnect();
  const [ledgerLegacyActor] = useCanister("ledgerLegacy");

  return useQuery({
    queryKey: ["userFetchBalanceOGYLegacy", owner],
    queryFn: () =>
      fetchBalanceOGYLegacy({
        actor: ledgerLegacyActor,
        owner: owner as string,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceOGYOwner;
