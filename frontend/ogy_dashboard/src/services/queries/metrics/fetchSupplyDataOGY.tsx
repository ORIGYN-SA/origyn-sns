import { TokenSupplyData } from "@services/types/token_metrics";
import { getActor } from "artemis-react";

const fetchFoundationAssetsOGY = async () => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const results = (await actor.get_supply_data()) as TokenSupplyData;
  return results;
};

export default fetchFoundationAssetsOGY;
