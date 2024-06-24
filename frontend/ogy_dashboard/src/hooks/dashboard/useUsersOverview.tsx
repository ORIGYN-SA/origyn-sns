import { useEffect, useState } from "react";
import { useCanister } from "@amerej/connect2ic-react";
import { useGetActivityStats } from "@hooks/super_stats_v3";
import { useGetSupplyAccounts } from "@hooks/ogy_api";
import { millify } from "@helpers/numbers";

const useUsersOverview = (start: number = 30) => {
  const [statsActor] = useCanister("tokenStats");
  const [data, setData] = useState<
    | {
        total: string;
        chart: Array<{
          name: string;
          value: number;
        }>;
      }
    | undefined
  >(undefined);
  const {
    data: dataActivityStats,
    isLoading: isLoadingActivityStats,
    isSuccess: isSuccessActivityStats,
    isError: isErrorActivityStats,
    error: errorActivityStats,
  } = useGetActivityStats({
    start,
    actor: statsActor,
  });
  const {
    data: dataSupplyAccounts,
    isLoading: isLoadingSupplyAccounts,
    isSuccess: isSuccessSupplyAccounts,
    isError: isErrorSupplyAccounts,
    error: errorSupplyAccounts,
  } = useGetSupplyAccounts({
    start,
  });

  useEffect(() => {
    if (
      isSuccessActivityStats &&
      isSuccessSupplyAccounts &&
      dataActivityStats &&
      dataSupplyAccounts
    ) {
      const chartData = dataActivityStats?.map((e, index) => {
        const oldLedgerAccountsCount = dataSupplyAccounts
          ? dataSupplyAccounts[index]?.count.number
          : 0;
        return {
          name: e.start_time.datetime.toFormat("LLL dd"),
          value: e.total_unique_accounts.number + oldLedgerAccountsCount,
        };
      });

      setData({
        total: millify(chartData[chartData?.length - 1].value),
        chart: chartData,
      });
    }
  }, [
    isSuccessActivityStats,
    isSuccessSupplyAccounts,
    dataActivityStats,
    dataSupplyAccounts,
  ]);

  return {
    data,
    isSuccess: isSuccessActivityStats && isSuccessActivityStats && data,
    isError: isErrorActivityStats || isErrorSupplyAccounts,
    isLoading:
      isLoadingActivityStats ||
      isLoadingSupplyAccounts ||
      (!data && !(isErrorActivityStats || isErrorSupplyAccounts)),
    error: errorActivityStats || errorSupplyAccounts,
  };
};

export default useUsersOverview;
