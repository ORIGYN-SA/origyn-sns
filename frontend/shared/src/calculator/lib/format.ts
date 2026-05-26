import millifyPackage from "millify";

const locale = "en-US";

export const millify = (value: number, precision?: number) =>
  millifyPackage(value, { precision: precision ?? 3, locales: locale });

// Placeholder value rendered under the skeleton overlay while the first
// estimate loads (matches the dashboard's FAKE_STAT_VALUE).
export const FAKE_STAT_VALUE = "000,000,000,000";
