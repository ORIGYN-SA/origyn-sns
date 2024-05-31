// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import useConnect from "@hooks/useConnect";
import fetchOwnerBalanceICP from "@services/queries/accounts/fetchOwnerBalanceICP";

const useFetchBalanceICPOwner = () => {
  const { principal: owner, isConnected } = useConnect();
  const [ledgerActor] = useCanister("ledgerICP");

  return useQuery({
    queryKey: ["userFetchBalanceICP", owner, isConnected],
    queryFn: () =>
      fetchOwnerBalanceICP({ actor: ledgerActor, owner: owner as string }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceICPOwner;
