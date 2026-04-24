// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWallet } from "@components/auth/useWallet";
import fetchBalanceOGYLegacy from "@services/queries/accounts/fetchBalanceOGYLegacy";

const useFetchBalanceOGYOwner = () => {
  const { principalId: owner, isConnected, subAccount, subAccountHex } =
    useWallet();

  return useQuery({
    queryKey: ["userFetchBalanceOGYLegacy", owner, subAccountHex, isConnected],
    queryFn: () =>
      fetchBalanceOGYLegacy({
        owner: owner as string,
        subAccount,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceOGYOwner;
