import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import gldtAPI from "@services/api/gldt/v1";
import { ApiGovernanceStats } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const fetchNeuronsStats = async () => {
  const { data } = await gldtAPI.get<ApiGovernanceStats>(
    gldtTokenPath("governance/stats")
  );

  const totalLocked = toBigInt(data.total_locked);
  const totalRewards = toBigInt(data.total_rewards);
  const totalStaked = toBigInt(data.total_staked);
  const totalUnlocked = toBigInt(data.total_unlocked);
  const total = totalLocked + totalRewards + totalStaked + totalUnlocked;

  return {
    totalLocked,
    totalRewards,
    totalStaked,
    totalUnlocked,
    total,
    string: {
      totalLocked: roundAndFormatLocale({
        number: divideBy1e8(totalLocked),
      }),
      totalRewards: roundAndFormatLocale({
        number: divideBy1e8(totalRewards),
      }),
      totalStaked: roundAndFormatLocale({
        number: divideBy1e8(totalStaked),
      }),
      totalUnlocked: roundAndFormatLocale({
        number: divideBy1e8(totalUnlocked),
      }),
      total: roundAndFormatLocale({
        number: divideBy1e8(total),
      }),
    },
    number: {
      totalLocked: divideBy1e8(totalLocked),
      totalRewards: divideBy1e8(totalRewards),
      totalStaked: divideBy1e8(totalStaked),
      totalUnlocked: divideBy1e8(totalUnlocked),
      total: divideBy1e8(total),
    },
  };
};

export default fetchNeuronsStats;
