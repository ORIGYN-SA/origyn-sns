// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWallet } from "@components/auth/useWallet";
import fetchBalanceOGY from "@services/queries/accounts/fetchBalanceOGY";

const useFetchBalanceOGYOwner = () => {
  const { principalId: owner, isConnected, subAccountHex } = useWallet();

  return useQuery({
    queryKey: ["userFetchBalanceOGY", owner, subAccountHex, isConnected],
    queryFn: () =>
      fetchBalanceOGY({ owner: owner as string, subaccount: subAccountHex }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceOGYOwner;
