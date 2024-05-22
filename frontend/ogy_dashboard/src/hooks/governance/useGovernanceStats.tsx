import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import fetchNeuronsStats from "@services/queries/governance/fetchNeuronsStats";

const useGovernanceStats = () => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");

  const {
    data,
    isSuccess: isSuccessGovernanceStats,
    isError: isErrorGovernanceStats,
    isLoading: isLoadingGovernanceStats,
    error: errorGovernanceStats,
  } = useQuery({
    queryKey: ["governanceStats"],
    queryFn: () =>
      fetchNeuronsStats({
        actor: tokenMetricsActor,
      }),
    placeholderData: keepPreviousData,
  });
  const isSuccess = isSuccessGovernanceStats;

  return {
    data: {
      tokensInGovernance: [
        {
          name: "Locked",
          value: data?.number.totalLocked,
          valueToString: data?.string.totalLocked,
          color: "#34d399",
        },
        {
          name: "Unlocked",
          value: data?.number.totalLocked,
          valueToString: data?.string.totalUnlocked,
          color: "#1d7555",
        },
        {
          name: "Accumulated Rewards",
          value: data?.number.totalRewards,
          valueToString: data?.string.totalRewards,
          color: "#7bf8ca",
        },
      ],
      tokensInGovernanceTotal: data?.string.total,
    },
    isLoading: isLoadingGovernanceStats,
    isSuccess,
    isError: isErrorGovernanceStats,
    error: errorGovernanceStats,
  };
};

export default useGovernanceStats;
