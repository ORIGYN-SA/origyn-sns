/** Display helpers shared by the GLDT app pages. Amounts on every chain are integers in the token's
 * smallest unit; these turn them into the strings the design shows. */

export const E8S = 100_000_000n;

/** `units` (an integer in the token's smallest unit) as a decimal number. Exact for display: the
 * integer part is split off before the conversion to float. */
export const toNumber = (units: bigint, decimals: number): number => {
  const base = 10n ** BigInt(decimals);
  return Number(units / base) + Number(units % base) / Number(base);
};

/** Parses a decimal string typed by the user into the token's smallest unit, or null when it is not
 * a plain positive decimal with at most `decimals` fraction digits. */
export const parseUnits = (text: string, decimals: number): bigint | null => {
  const raw = text.trim();
  // A single comma is a decimal point (1,5 is 1.5), never a thousands separator.
  const commas = (raw.match(/,/g) ?? []).length;
  if (commas > 1 || (commas === 1 && raw.includes("."))) return null;
  const t = raw.replace(",", ".");
  if (!/^\d*\.?\d*$/.test(t) || t === "" || t === ".") return null;
  const [int, frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  return BigInt(int || "0") * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, "0") || "0");
};

/** A number with thousands separators and at most `digits` fraction digits; zero is "0". */
export const fmt = (v: number, digits = 2): string => {
  if (v === 0) return "0";
  return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });
};

/** An integer amount in the token's smallest unit, formatted like fmt. */
export const fmtUnits = (units: bigint, decimals: number, digits = 2): string =>
  fmt(toNumber(units, decimals), digits);

/** A USD value as "$1,234.56". */
export const usd = (v: number): string =>
  "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "Nov 14, 3:22 PM", in the viewer's time zone. */
export const shortDate = (ms: number): string =>
  new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** "2026-11-14, 03:22:10 PM UTC", the long form the transaction details use. */
export const utcDate = (ms: number): string => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  const h = d.getUTCHours() % 12 || 12;
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}, ${p(h)}:${p(
    d.getUTCMinutes()
  )}:${p(d.getUTCSeconds())} ${d.getUTCHours() < 12 ? "AM" : "PM"} UTC`;
};
