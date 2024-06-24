import { ActorSubclass } from "@dfinity/agent";
import { HistoryData } from "@services/types/token_metrics";

const fetchTokenHolders = async ({
  actor,
  start = 30,
}: {
  actor: ActorSubclass;
  start: number;
}): Promise<Array<[bigint, HistoryData]>> => {
  const results = await actor.get_stake_history(start);
  return results as Array<[bigint, HistoryData]>;
};

export default fetchTokenHolders;
