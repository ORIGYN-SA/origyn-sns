import { gldtClient, gldtTokenPath } from "./gldt";

export const divideBy1e8 = (n) => Number(n) / 1e8;

export const roundAndFormatLocale = (n, decimals = 2) =>
  Number(Number(n).toFixed(decimals)).toLocaleString("en-US");

const dateFormatter = (opts) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });

const DAY_LABEL = dateFormatter({ month: "short", day: "2-digit" });
const MONTH_LABEL = dateFormatter({ month: "short", year: "numeric" });

const PERIOD_CONFIG = {
  daily: { group: "day", pointCount: 2, formatter: DAY_LABEL },
  weekly: { group: "day", pointCount: 7, formatter: DAY_LABEL },
  monthly: { group: "day", pointCount: 30, formatter: DAY_LABEL },
  yearly: { group: "month", pointCount: 12, formatter: MONTH_LABEL },
};

const configForPeriod = (period) =>
  PERIOD_CONFIG[period] ?? PERIOD_CONFIG.weekly;

const toUtcDate = (date) => {
  const normalizedDate = String(date ?? "");
  return new Date(
    normalizedDate.includes("T")
      ? normalizedDate
      : `${normalizedDate}T00:00:00.000Z`
  );
};

const getTimestamp = (item) => toUtcDate(item?.date).getTime();

const isValidHistoryDate = (item) => Number.isFinite(getTimestamp(item));

const sortSupplyHistory = (items) =>
  (Array.isArray(items) ? items : [])
    .filter(isValidHistoryDate)
    .sort((a, b) => getTimestamp(a) - getTimestamp(b));

const formatHistoryDate = (date, formatter) =>
  formatter.format(toUtcDate(date)).replace(",", "");

export const fetchSupplyHistory = async (period) => {
  const config = configForPeriod(period);
  const { data } = await gldtClient.get(
    gldtTokenPath("supply/history", { group: config.group })
  );
  return { items: data, config };
};

export const toSupplySeries = (items, field, config) =>
  sortSupplyHistory(items)
    .filter((item) => Number.isFinite(Number(item[field])))
    .slice(-config.pointCount)
    .map((item) => ({
      name: formatHistoryDate(item.date, config.formatter),
      value: divideBy1e8(item[field]),
    }));

export const fetchSupplySummary = async () => {
  const { data } = await gldtClient.get(gldtTokenPath("supply/summary"));
  return data;
};

export const fetchLatestSupplyHistory = async (group = "year") => {
  const { data } = await gldtClient.get(
    gldtTokenPath("supply/history", { group })
  );
  const items = sortSupplyHistory(data);
  return items[items.length - 1];
};
