import { defaultLocale, isLocale, locales, type Locale } from "./config";

export const LOCALE_STORAGE_KEY = "origyn-ai-locale";

// Match a single BCP 47 tag against our supported locales by primary subtag:
// "fr-CH" -> "fr", "zh-Hans-CN" -> "zh". Adequate for a 5-locale set and avoids
// pulling in @formatjs/intl-localematcher.
const matchTag = (tag: string): Locale | null => {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;
  if (isLocale(normalized)) return normalized;
  const base = normalized.split("-")[0];
  return (locales as readonly string[]).includes(base) ? (base as Locale) : null;
};

const readStored = (): Locale | null => {
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw && isLocale(raw) ? raw : null;
  } catch {
    return null; // private mode / storage disabled
  }
};

export const rememberLocale = (locale: Locale): void => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* non-fatal: the URL still carries the choice */
  }
};

// First-visit resolution order: explicit prior choice -> browser languages
// (highest preference first) -> default. There is no IP/country tier because
// the asset canister serves static files with no request-time server.
export const negotiateLocale = (): Locale => {
  const stored = readStored();
  if (stored) return stored;

  const preferred =
    typeof navigator !== "undefined"
      ? (navigator.languages?.length
          ? navigator.languages
          : [navigator.language]
        ).filter(Boolean)
      : [];

  for (const tag of preferred) {
    const matched = matchTag(tag);
    if (matched) return matched;
  }

  return defaultLocale;
};
