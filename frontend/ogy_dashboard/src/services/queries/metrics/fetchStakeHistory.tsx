import { HistoryData } from "@services/types/token_metrics";
import { getActor } from "@amerej/artemis-react";

const fetchTokenHolders = async ({
  start = 30,
}: {
  start: number;
}): Promise<Array<[bigint, HistoryData]>> => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const results = await actor.get_stake_history(start);
  console.log("results", results);
  return results as Array<[bigint, HistoryData]>;
};

export default fetchTokenHolders;
