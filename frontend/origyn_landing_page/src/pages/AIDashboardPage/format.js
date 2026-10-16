import { useMemo } from "react";
import { useLocale } from "@/i18n/LocaleContext";

const E8S = 100_000_000n;

export const MIN_USD_CENTS = 1_000;
export const MAX_USD_CENTS = 10_000_000;
export const DEFAULT_USD_CENTS = 2_500;

export const toE8s = (value) => BigInt(value ?? 0);

export const parseUsdInput = (text) => {
  if (!/^\d+$/.test(text)) return null;
  const cents = Number(text) * 100;
  return cents >= MIN_USD_CENTS && cents <= MAX_USD_CENTS ? cents : null;
};

const UNITS = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

// Formatters bound to the page's locale. Credits come as e8s strings
// (1 credit = 100,000,000 e8s): BigInt keeps them exact, and they are
// truncated to two decimals before Intl sees them, so nothing rounds up.
export const useFormat = () => {
  const { locale } = useLocale();
  return useMemo(() => {
    const credits = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const usd = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
    });
    const usdWhole = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    const dateTime = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    return {
      credits: (e8s) => {
        const value = toE8s(e8s);
        const cents = ((value % E8S) / 1_000_000n).toString().padStart(2, "0");
        return credits.format(`${value / E8S}.${cents}`);
      },
      usd: (cents) => (cents % 100 === 0 ? usdWhole : usd).format(cents / 100),
      dateTime: (iso) => (iso ? dateTime.format(new Date(iso)) : ""),
      day: (iso) => (iso ? day.format(new Date(iso)) : ""),
      relative: (iso) => {
        const diff = new Date(iso).getTime() - Date.now();
        const unit = UNITS.find(([, ms]) => Math.abs(diff) >= ms);
        return unit
          ? relative.format(Math.round(diff / unit[1]), unit[0])
          : relative.format(0, "minute");
      },
    };
  }, [locale]);
};
