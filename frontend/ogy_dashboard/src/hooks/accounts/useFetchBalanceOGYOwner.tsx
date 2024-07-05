// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWallet } from "artemis-react";
import fetchBalanceOGY from "@services/queries/accounts/fetchBalanceOGY";

const useFetchBalanceOGYOwner = () => {
  const { principalId: owner, isConnected } = useWallet();

  return useQuery({
    queryKey: ["userFetchBalanceOGY", owner, isConnected],
    queryFn: () => fetchBalanceOGY({ owner: owner as string }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceOGYOwner;
