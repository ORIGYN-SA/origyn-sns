import { ActorSubclass } from "@dfinity/agent";
import { TokenSupplyData } from "@services/types/token_metrics";

const fetchFoundationAssetsOGY = async ({
  actor,
}: {
  actor: ActorSubclass;
}) => {
  const results = (await actor.get_supply_data()) as TokenSupplyData;
  return results;
};

export default fetchFoundationAssetsOGY;
