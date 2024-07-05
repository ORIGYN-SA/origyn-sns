import { HistoryData } from "@services/types/token_metrics";
import { getActor } from "artemis-react";

const fetchAccountBalanceHistoryQuery = async ({
  account,
}: {
  account: string;
}): Promise<Array<[bigint, HistoryData]>> => {
  const actor = await getActor("tokenStats", { isAnon: true });
  const data = await actor.get_principal_history({ days: 30, account });
  return data as Array<[bigint, HistoryData]>;
};

export default fetchAccountBalanceHistoryQuery;
