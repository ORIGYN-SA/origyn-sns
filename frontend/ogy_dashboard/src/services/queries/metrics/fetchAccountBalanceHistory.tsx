import { DateTime } from "luxon";
import { HistoryData } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiAccountTimeseriesItem } from "@services/api/gldt/v1/types";
import { gldtTokenPath, tokenAmountToE8s } from "@services/api/gldt/v1/utils";

const MS_PER_DAY = 86_400_000;

const toDayNumber = (date: string) =>
  BigInt(
    Math.floor(DateTime.fromISO(date, { zone: "utc" }).toMillis() / MS_PER_DAY)
  );

const fetchAccountBalanceHistoryQuery = async ({
  account,
  days = 30,
}: {
  account: string;
  days?: number;
}): Promise<Array<[bigint, HistoryData]>> => {
  const { data } = await gldtAPI.get<ApiAccountTimeseriesItem[]>(
    gldtTokenPath(`accounts/${encodeURIComponent(account)}/timeseries`)
  );

  const history = data
    .map(({ date, balance }): [bigint, HistoryData] => {
      return [toDayNumber(date), { balance: tokenAmountToE8s(balance) }];
    })
    .sort((a, b) => Number(a[0] - b[0]));

  return days > 0 ? history.slice(-days) : history;
};

export default fetchAccountBalanceHistoryQuery;
