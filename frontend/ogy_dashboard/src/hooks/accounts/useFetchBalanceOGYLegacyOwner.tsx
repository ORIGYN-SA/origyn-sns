// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWallet } from "artemis-react";
import fetchBalanceOGYLegacy from "@services/queries/accounts/fetchBalanceOGYLegacy";

const useFetchBalanceOGYOwner = () => {
  const { principalId: owner, isConnected } = useWallet();

  return useQuery({
    queryKey: ["userFetchBalanceOGYLegacy", owner, isConnected],
    queryFn: () =>
      fetchBalanceOGYLegacy({
        owner: owner as string,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceOGYOwner;
