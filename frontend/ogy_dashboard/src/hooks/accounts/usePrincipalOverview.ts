import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPrincipalOverview } from "@hooks/super_stats_v3/queries";
import { divideBy1e8 } from "@helpers/numbers";

interface TransactionStats {
  totalSend: number;
  totalReceive: number;
  totalVolume: number;
}

const usePrincipalOverview = (principal: string) => {
  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["principalOverview", principal],
    queryFn: () => getPrincipalOverview({ principalId: principal }),
    enabled: !!principal,
  });

  const data = useMemo<TransactionStats | null>(() => {
    if (isLoading || !isSuccess || !response) return null;

    const totalSend = divideBy1e8(response.sent[1]);
    const totalReceive = divideBy1e8(response.received[1]);

    return {
      totalSend,
      totalReceive,
      totalVolume: totalSend + totalReceive,
    };
  }, [isLoading, isSuccess, response]);

  return {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  };
};

export default usePrincipalOverview;
