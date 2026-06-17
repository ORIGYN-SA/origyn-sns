import { ActivitySnapshot } from "@hooks/token_metrics/declarations_files/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiActivityItem } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const MAX_ACTIVITY_DAYS = 365;
const MS_TO_NS = 1_000_000n;

const toActivitySnapshot = (item: ApiActivityItem): ActivitySnapshot => ({
  principals_active_during_snapshot: toBigInt(item.principals_active),
  accounts_active_during_snapshot: toBigInt(item.accounts_active),
  total_unique_accounts: toBigInt(item.total_unique_accounts),
  total_unique_principals: toBigInt(item.total_unique_principals),
  start_time: toBigInt(item.start_time) * MS_TO_NS,
  end_time: toBigInt(item.end_time) * MS_TO_NS,
});

const fetchActivityStats = async (
  days: number
): Promise<Array<ActivitySnapshot>> => {
  const cappedDays = Math.min(Math.max(days, 1), MAX_ACTIVITY_DAYS);
  const { data } = await gldtAPI.get<ApiActivityItem[]>(
    gldtTokenPath("activity", { days: cappedDays })
  );
  return data.map(toActivitySnapshot);
};

export default fetchActivityStats;
