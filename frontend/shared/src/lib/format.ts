import millifyPackage from "millify";

const locale = "en-US";

export const millify = (value: number, precision?: number) =>
  millifyPackage(value, { precision: precision ?? 3, locales: locale });

// Formats large token amounts: exa/peta suffixes above millify's range,
// otherwise millify (1.2K, 3.4M, ...). Used for area-chart axis/tooltip values.
export const formatValue = (value: number) => {
  if (value >= 1e18) {
    return `${(value / 1e18).toFixed(2)} E`;
  }
  if (value >= 1e15) {
    return `${(value / 1e15).toFixed(2)} P`;
  }
  return millify(value);
};

// Placeholder value rendered under the skeleton overlay while the first
// estimate loads (matches the dashboard's FAKE_STAT_VALUE).
export const FAKE_STAT_VALUE = "000,000,000,000";
