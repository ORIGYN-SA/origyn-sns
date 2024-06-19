import { ActorSubclass } from "@dfinity/agent";
import { HistoryData } from "@services/types/token_metrics";

const fetchAccountBalanceHistoryQuery = async ({
  account,
  actor,
}: {
  account: string;
  actor: ActorSubclass;
}): Promise<Array<[bigint, HistoryData]>> => {
  const data = await actor.get_principal_history({ days: 30, account });
  return data as Array<[bigint, HistoryData]>;
};

export default fetchAccountBalanceHistoryQuery;
