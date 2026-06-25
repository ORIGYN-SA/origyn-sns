import { HistoryData } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiStakeHistoryItem } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const fetchStakeHistory = async ({
  start = 30,
}: {
  start: number;
}): Promise<Array<[bigint, HistoryData]>> => {
  const { data } = await gldtAPI.get<ApiStakeHistoryItem[]>(
    gldtTokenPath("governance/stake-history", { days: start })
  );
  return data.map(
    ({ day, balance }) =>
      [toBigInt(day), { balance: toBigInt(balance) }] as [bigint, HistoryData]
  );
};

export default fetchStakeHistory;
