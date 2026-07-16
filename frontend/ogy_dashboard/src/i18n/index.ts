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
  /**
   * Resolve a count-dependent label. The key must point to an object with
   * `one`/`other` variants; locales without a `one` variant use `other`.
   */
  plural: (key: string, count: number) => string;
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

  t.raw = <T>(key: string) => lookup(key) as T;

  const pluralRules = new Intl.PluralRules(active);
  t.plural = (key: string, count: number) => {
    const form = pluralRules.select(count) === "one" ? "one" : "other";
    const value = lookup(`${key}.${form}`) ?? lookup(`${key}.other`);
    return typeof value === "string" ? value : key;
  };

  return t;
};
