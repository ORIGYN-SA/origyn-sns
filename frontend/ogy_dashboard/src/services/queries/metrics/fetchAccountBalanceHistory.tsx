import { HistoryData } from "@services/types/token_metrics";
import { getActor } from "@services/actor";

const fetchAccountBalanceHistoryQuery = async ({
  account,
  days = 30,
}: {
  account: string;
  days?: number;
}): Promise<Array<[bigint, HistoryData]>> => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const data = await actor.get_principal_history({ days, account });
  return data as Array<[bigint, HistoryData]>;
};

export default fetchAccountBalanceHistoryQuery;
