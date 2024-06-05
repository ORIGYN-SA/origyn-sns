import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchAccountOverview from "@services/queries/metrics/fetchAccountOverview";
import { useCanister } from "@amerej/connect2ic-react";

export type BalanceOverview = {
  balance: bigint;
  sent: bigint;
  last_active:bigint;
  first_active:bigint;
  received: bigint;
}

const useAccountOverview = (account: string) => {
  const [data, setData] = useState<BalanceOverview>();
  const [statsActor] = useCanister("tokenStats");

  const {
    data: fetchedData,
    isSuccess,
    isLoading,
    error,
  }: UseQueryResult<BalanceOverview[]> = useQuery(fetchAccountOverview({account, actor: statsActor}));

  useEffect(() => {
    if (isSuccess && fetchedData) {
      setData(fetchedData[0]);
    }
  }, [
    isSuccess,
    fetchedData,
  ]);

  return { data, isSuccess, isLoading, error };
};

export default useAccountOverview;
