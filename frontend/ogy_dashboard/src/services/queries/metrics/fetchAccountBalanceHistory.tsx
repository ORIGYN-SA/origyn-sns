import { DateTime } from "luxon";
import { HistoryData } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiAccountTimeseriesItem } from "@services/api/gldt/v1/types";
import { gldtTokenPath, tokenAmountToE8s } from "@services/api/gldt/v1/utils";
import { toIcrcAccountText } from "@helpers/principal";

const MS_PER_DAY = 86_400_000;

const toDayNumber = (date: string) =>
  BigInt(
    Math.floor(DateTime.fromISO(date, { zone: "utc" }).toMillis() / MS_PER_DAY)
  );

// The API caps `group=day` responses at the last ~30 points, so longer
// periods must request coarser buckets to cover their full window.
const groupForDays = (days: number) => {
  if (days <= 0) return "month";
  if (days <= 30) return "day";
  if (days <= 90) return "week";
  return "month";
};

const fetchAccountBalanceHistoryQuery = async ({
  account,
  days = 30,
}: {
  account: string;
  days?: number;
}): Promise<Array<[bigint, HistoryData]>> => {
  const { data } = await gldtAPI.get<ApiAccountTimeseriesItem[]>(
    // Unlike the other GLDT account endpoints, timeseries only accepts the
    // ICRC-1 textual account encoding (or a bare principal) — never oracle
    // form.
    gldtTokenPath(
      `accounts/${encodeURIComponent(toIcrcAccountText(account))}/timeseries`,
      {
        group: groupForDays(days),
      }
    )
  );

  const history = data
    .map(({ date, balance }): [bigint, HistoryData] => {
      return [toDayNumber(date), { balance: tokenAmountToE8s(balance) }];
    })
    .sort((a, b) => Number(a[0] - b[0]));

  if (days <= 0) return history;

  const cutoff = BigInt(Math.floor(Date.now() / MS_PER_DAY) - days + 1);
  return history.filter(([day]) => day >= cutoff);
};

export default fetchAccountBalanceHistoryQuery;
