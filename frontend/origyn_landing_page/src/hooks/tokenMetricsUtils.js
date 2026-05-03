const DAY_IN_SECONDS = 86400;
const HOUR_STEP_IN_SECONDS = 600;
const OGY_LEDGER_CANISTER_ID = "lkwrt-vyaaa-aaaaq-aadhq-cai";

const PERIOD_CONFIG = {
  daily: {
    rangeInSeconds: DAY_IN_SECONDS,
    step: HOUR_STEP_IN_SECONDS,
    sliceSize: 1,
  },
  weekly: {
    rangeInSeconds: DAY_IN_SECONDS * 7,
    step: HOUR_STEP_IN_SECONDS,
    sliceSize: 7,
  },
  monthly: {
    rangeInSeconds: DAY_IN_SECONDS * 30,
    step: DAY_IN_SECONDS,
    sliceSize: 30,
  },
  yearly: {
    rangeInSeconds: DAY_IN_SECONDS * 365,
    step: DAY_IN_SECONDS,
    sliceSize: 365,
  },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const divideBy1e8 = (number) => Number(number) / 1e8;

export const roundAndFormatLocale = (number, decimals = 2) =>
  Number(number.toFixed(decimals)).toLocaleString("en-US");

export const getCurrentDateInSeconds = () => Math.floor(Date.now() / 1000);

export const getIcrcApiConfig = () => {
  const apiBaseUrl = import.meta.env.VITE_API_ICRC_V1_BASE_URL;
  const snsLedgerCanisterId =
    import.meta.env.VITE_OGY_SNS_LEDGER_CANISTER_ID ?? OGY_LEDGER_CANISTER_ID;

  if (!apiBaseUrl) {
    throw new Error("Missing ICRC API base URL for OGY metrics");
  }

  return { apiBaseUrl, snsLedgerCanisterId };
};

export const getTimeSeriesPeriod = (period = "weekly") => {
  const config = PERIOD_CONFIG[period] ?? PERIOD_CONFIG.weekly;
  const end = getCurrentDateInSeconds();

  return {
    ...config,
    end,
    start: Math.max(0, end - config.rangeInSeconds),
  };
};

export const formatTimeSeriesLabel = (timestamp, step = DAY_IN_SECONDS) => {
  const date = new Date(Number(timestamp) * 1000);
  const formatter = step < DAY_IN_SECONDS ? DATE_TIME_FORMATTER : DATE_FORMATTER;

  return formatter.format(date).replace(",", "");
};

export const transformTimeSeriesData = (entries = [], step = DAY_IN_SECONDS) =>
  entries
    .map((entry) => ({
      name: formatTimeSeriesLabel(entry?.[0] ?? 0, step),
      value: divideBy1e8(entry?.[1] ?? 0),
    }))
    .filter((entry) => Number.isFinite(entry.value));

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCompactNumber = (value) =>
  COMPACT_NUMBER_FORMATTER.format(value);

export { DAY_IN_SECONDS };
