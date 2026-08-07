import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

export interface RewardPool {
  year: string;
  reward_pool: string;
}

// Published tokenomics schedule, not ledger state, so it is not read from the API.
const REWARDS_POOL: RewardPool[] = [
  { year: "Sept 2023", reward_pool: "250M OGY" },
  { year: "Sept 2024", reward_pool: "250M OGY" },
  { year: "Sept 2025", reward_pool: "125M OGY" },
  { year: "Sept 2026", reward_pool: "125M OGY" },
  { year: "Sept 2027", reward_pool: "62.5M OGY" },
  { year: "...", reward_pool: "Halves every two years" },
];

const FIVE_MINUTES = 5 * 60 * 1000;

const useFetchOGYRewardAccount = () => {
  const query = useQuery({
    queryKey: ["fetchOGYRewardAccount"],
    queryFn: () => gldtEndpoints.getOraBalance(),
    placeholderData: keepPreviousData,
    staleTime: FIVE_MINUTES,
  });

  return {
    ...query,
    data: {
      // Headline balance is the reserve subaccount [1,0..].
      rewardAccountBalance: query.data
        ? roundAndFormatLocale({ number: divideBy1e8(query.data.ora_balance) })
        : undefined,
      rewardsPool: { rows: REWARDS_POOL },
    },
  };
};

export default useFetchOGYRewardAccount;
