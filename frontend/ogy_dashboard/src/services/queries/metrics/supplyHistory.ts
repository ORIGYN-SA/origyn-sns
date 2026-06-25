import { DateTime } from "luxon";
import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import {
  ApiSupplyHistoryGroup,
  ApiSupplyHistoryItem,
} from "@services/api/gldt/v1/types";
import { ChartData } from "@services/types/charts.types";
import { divideBy1e8 } from "@helpers/numbers";

type PeriodConfig = {
  group: ApiSupplyHistoryGroup;
  pointCount: number;
  dateFormat: string;
};

const DEFAULT_PERIOD_CONFIG: PeriodConfig = {
  group: "day",
  pointCount: 30,
  dateFormat: "LLL dd",
};

const PERIOD_CONFIG: Record<string, PeriodConfig | undefined> = {
  daily: { group: "day", pointCount: 2, dateFormat: "LLL dd" },
  weekly: { group: "day", pointCount: 7, dateFormat: "LLL dd" },
  monthly: DEFAULT_PERIOD_CONFIG,
  yearly: { group: "month", pointCount: 12, dateFormat: "LLL yyyy" },
};

const configForPeriod = (period: string): PeriodConfig =>
  PERIOD_CONFIG[period] ?? DEFAULT_PERIOD_CONFIG;

export const fetchSupplyHistoryByGroup = async (
  group: ApiSupplyHistoryGroup
): Promise<ApiSupplyHistoryItem[]> => {
  const { data } = await gldtAPI.get<ApiSupplyHistoryItem[]>(
    gldtTokenPath("supply/history", { group })
  );
  return data;
};

export const fetchSupplyHistory = async (
  period: string
): Promise<{ items: ApiSupplyHistoryItem[]; config: PeriodConfig }> => {
  const config = configForPeriod(period);
  const items = await fetchSupplyHistoryByGroup(config.group);
  return { items, config };
};

export const toSupplySeries = (
  items: ApiSupplyHistoryItem[],
  field: "total_supply" | "total_burned",
  config: PeriodConfig
): ChartData[] =>
  items.slice(-config.pointCount).map((item) => ({
    name: DateTime.fromISO(item.date).toFormat(config.dateFormat),
    value: divideBy1e8(Number(item[field])),
  }));
