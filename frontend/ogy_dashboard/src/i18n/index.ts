import {
  defaultLocale,
  normalizeLocale,
  resolveKey,
  type Locale,
} from "./config";
import { messages } from "./messages";

export {
  locales,
  defaultLocale,
  isLocale,
  normalizeLocale,
  dirFor,
} from "./config";
export type { Locale } from "./config";

export type Translate = {
  /** Resolve a dot-path to a string, falling back to the default locale. */
  (key: string): string;
  /** Resolve a dot-path to its raw value (array/object/string). */
  raw: <T>(key: string) => T;
};

// Build the translator for a locale. Missing keys fall back to the default
// locale, then to the key itself, so a partial catalog degrades gracefully
// instead of rendering blanks.
export const getT = (locale: Locale | string | undefined): Translate => {
  const active = normalizeLocale(locale);
  const primary = messages[active];
  const fallback = messages[defaultLocale];

  const lookup = (key: string): unknown =>
    resolveKey(primary, key) ?? resolveKey(fallback, key);

  const t = ((key: string) => {
    const value = lookup(key);
    return typeof value === "string" ? value : key;
  }) as Translate;

  t.raw = <T,>(key: string) => lookup(key) as T;

  return t;
};
