import { ActorSubclass } from "@dfinity/agent";
import { WalletOverview } from "@services/types/token_metrics";

const fetchFoundationAssetsOGY = async ({
  actor,
}: {
  actor: ActorSubclass;
}) => {
  const results = (await actor.get_foundation_assets()) as Array<
    [string, WalletOverview]
  >;
  return results.length
    ? (results as Array<[string, WalletOverview]>)[0][1]
    : null;
};

export default fetchFoundationAssetsOGY;
