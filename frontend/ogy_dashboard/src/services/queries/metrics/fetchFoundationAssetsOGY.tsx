import { divideBy1e8 } from "@helpers/numbers";
import gldtAPI from "@services/api/gldt/v1";
import { ApiHolderRow } from "@services/api/gldt/v1/types";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";

const fetchFoundationAssetsOGY = async () => {
  const { data: results } = await gldtAPI.get<ApiHolderRow[]>(
    gldtTokenPath("foundation/assets")
  );
  const result = results.reduce(
    (acc, { overview: { governance, total } }) => {
      acc.total_locked += divideBy1e8(Number(governance.total_locked));
      acc.total_rewards += divideBy1e8(Number(governance.total_rewards));
      acc.total_staked += divideBy1e8(Number(governance.total_staked));
      acc.total_unlocked += divideBy1e8(Number(governance.total_unlocked));
      acc.total += divideBy1e8(Number(total));
      return acc;
    },
    {
      total_locked: 0,
      total_rewards: 0,
      total_staked: 0,
      total_unlocked: 0,
      total: 0,
    }
  );
  return result;
};

export default fetchFoundationAssetsOGY;
