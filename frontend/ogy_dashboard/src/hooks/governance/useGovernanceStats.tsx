import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchNeuronsStats from "@services/queries/governance/fetchNeuronsStats";
import { roundAndFormatLocale } from "@helpers/numbers/index";

interface IGovernanceStats {
  tokensInGovernance: Array<{
    name: string;
    value: number;
    valueToString: string;
    color: string;
  }>;
  tokensInGovernanceTotal: string;
}

const useGovernanceStats = () => {
  const [governanceData, setGovernanceData] = useState<IGovernanceStats | null>(
    null
  );

  const {
    data,
    isSuccess: isSuccessGovernanceStats,
    isError: isErrorGovernanceStats,
    isLoading: isLoadingGovernanceStats,
    error: errorGovernanceStats,
  } = useQuery({
    queryKey: ["governanceStats"],
    queryFn: () => fetchNeuronsStats(),
    placeholderData: keepPreviousData,
  });
  const isSuccess = isSuccessGovernanceStats;

  useEffect(() => {
    if (isSuccessGovernanceStats) {
      setGovernanceData({
        tokensInGovernance: [
          {
            name: "Locked",
            value: data.number.totalLocked,
            valueToString: data.string.totalLocked,
            color: "#34d399",
          },
          {
            name: "Unlocked",
            value: data.number.totalUnlocked,
            valueToString: data.string.totalUnlocked,
            color: "#1d7555",
          },
          {
            name: "Accumulated Rewards",
            value: data.number.totalRewards,
            valueToString: data.string.totalRewards,
            color: "#7bf8ca",
          },
        ],
        tokensInGovernanceTotal: roundAndFormatLocale({
          number: data.number.totalLocked + data.number.totalUnlocked,
        }),
      });
    }
  }, [isSuccessGovernanceStats, data]);
  return {
    data: governanceData,
    isLoading: isLoadingGovernanceStats,
    isSuccess,
    isError: isErrorGovernanceStats,
    error: errorGovernanceStats,
  };
};

export default useGovernanceStats;
