// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWallet } from "artemis-react";
import fetchOwnerBalanceICP from "@services/queries/accounts/fetchOwnerBalanceICP";

const useFetchBalanceICPOwner = () => {
  const { principalId: owner, isConnected } = useWallet();

  return useQuery({
    queryKey: ["userFetchBalanceICP", owner, isConnected],
    queryFn: async () => fetchOwnerBalanceICP({ owner: owner as string }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceICPOwner;
