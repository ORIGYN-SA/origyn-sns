import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchAccountBalanceHistory from "@services/queries/metrics/fetchAccountBalanceHistory";
import { useCanister } from "@amerej/connect2ic-react";
import { ChartData } from "@services/types/charts.types";
import { divideBy1e8 } from "@helpers/numbers";

interface NumberStringTuple extends Array<{balance: string}|number>{0:number; 1:{balance: string}}

const useAccountBalanceHistory = (account: string) => {
  const [data, setData] = useState(
    [] as ChartData[]
  );
  const [statsActor] = useCanister("tokenStats");

  const {
    data: fetchedData,
    isSuccess,
    isLoading,
    error,
  }: UseQueryResult<Array<NumberStringTuple>> = useQuery(fetchAccountBalanceHistory({account, actor: statsActor}));

  useEffect(() => {
    if (isSuccess) {
      setData(fetchedData.map((v) => ({name: new Date(Number(v[0])).toDateString(), value: divideBy1e8(v[1].balance)})));
    }
  }, [
    isSuccess,
    fetchedData,
  ]);

  return { data, isSuccess, isLoading, error };
};

export default useAccountBalanceHistory;
