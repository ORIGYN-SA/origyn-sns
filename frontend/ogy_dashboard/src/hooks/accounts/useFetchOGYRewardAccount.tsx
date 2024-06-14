import { useEffect, useMemo, useState } from "react";
import { ColumnDef, Getter } from "@tanstack/react-table";
import useFetchBalanceOGY from "@hooks/accounts/useFetchBalanceOGY";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";

export interface RewardPool {
  year: string;
  reward_pool: string;
}

const useFetchOGYRewardAccount = () => {
  const [rewardAccountBalance, setRewardAccountBalance] = useState<string>();
  const rewardsPoolColumns = useMemo<ColumnDef<RewardPool>[]>(
    () => [
      {
        accessorKey: "year",
        id: "year",
        cell: ({ getValue }: { getValue: Getter<string> }) => (
          <div>{getValue()}</div>
        ),
        header: "Year",
        enableSorting: false,
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "reward_pool",
        id: "reward_pool",
        cell: ({ getValue }: { getValue: Getter<string> }) => (
          <div>{getValue()}</div>
        ),
        header: "Reward Pool",
        enableSorting: false,
      },
    ],
    []
  );
  const rewardsPool = useMemo(
    () => [
      {
        year: "Sept 2023",
        reward_pool: "250M OGY",
      },
      { year: "Sept 2024", reward_pool: "250M OGY" },
      { year: "Sept 2025", reward_pool: "125M OGY" },
      { year: "Sept 2026", reward_pool: "125M OGY" },
      { year: "Sept 2027", reward_pool: "62.5M OGY" },
      { year: "...", reward_pool: "Halves every two years" },
    ],
    []
  );

  const {
    data: rewardAcccountBalance,
    isLoading: isLoadingRewardAcccountBalance,
    isError: isErrorRewardAcccountBalance,
    isSuccess: isSuccessRewardAcccountBalance,
    error: errorRewardAcccountBalance,
  } = useFetchBalanceOGY({
    owner: SNS_REWARDS_CANISTER_ID,
    subaccount:
      "0100000000000000000000000000000000000000000000000000000000000000",
  });

  useEffect(() => {
    if (isSuccessRewardAcccountBalance) {
      setRewardAccountBalance(rewardAcccountBalance.string.balance);
    }
  }, [isSuccessRewardAcccountBalance, rewardAcccountBalance]);

  return {
    data: {
      rewardAccountBalance,
      rewardsPool: {
        rows: rewardsPool,
      },
      rewardsPoolColumns,
    },
    isSuccess:
      isSuccessRewardAcccountBalance && rewardAccountBalance !== undefined,
    isLoading:
      !isErrorRewardAcccountBalance &&
      (isLoadingRewardAcccountBalance || rewardAccountBalance === undefined),
    isError: isErrorRewardAcccountBalance,
    error: errorRewardAcccountBalance,
  };
};

export default useFetchOGYRewardAccount;
