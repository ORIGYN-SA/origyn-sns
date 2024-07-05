import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { GovernanceStats } from "@services/types/token_metrics";
import { getActor } from "artemis-react";

const fetchNeuronsStats = async () => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const result = (await actor.get_neurons_stats([])) as GovernanceStats;

  const total =
    result.total_locked +
    result.total_rewards +
    result.total_staked +
    result.total_unlocked;
  return {
    totalLocked: result.total_locked,
    totalRewards: result.total_rewards,
    totalStaked: result.total_staked,
    totalUnlocked: result.total_unlocked,
    total,
    string: {
      totalLocked: roundAndFormatLocale({
        number: divideBy1e8(result.total_locked),
      }),
      totalRewards: roundAndFormatLocale({
        number: divideBy1e8(result.total_rewards),
      }),
      totalStaked: roundAndFormatLocale({
        number: divideBy1e8(result.total_staked),
      }),
      totalUnlocked: roundAndFormatLocale({
        number: divideBy1e8(result.total_unlocked),
      }),
      total: roundAndFormatLocale({
        number: divideBy1e8(total),
      }),
    },
    number: {
      totalLocked: divideBy1e8(result.total_locked),
      totalRewards: divideBy1e8(result.total_rewards),
      totalStaked: divideBy1e8(result.total_staked),
      totalUnlocked: divideBy1e8(result.total_unlocked),
      total: divideBy1e8(total),
    },
  };
};

export default fetchNeuronsStats;
