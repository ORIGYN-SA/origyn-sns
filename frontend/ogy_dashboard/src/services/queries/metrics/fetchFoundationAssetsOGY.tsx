import { ActorSubclass } from "@dfinity/agent";
import { divideBy1e8 } from "@helpers/numbers";
import { WalletOverview } from "@services/types/token_metrics";

const fetchFoundationAssetsOGY = async ({
  actor,
}: {
  actor: ActorSubclass;
}) => {
  const results = (await actor.get_foundation_assets()) as Array<
    [string, WalletOverview]
  >;
  const result = results.reduce(
    (acc, [, { governance, total }]) => {
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
