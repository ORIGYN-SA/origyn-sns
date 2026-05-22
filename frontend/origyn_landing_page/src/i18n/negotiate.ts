import { defaultLocale, isLocale, locales, type Locale } from "./config";

export const LOCALE_STORAGE_KEY = "origyn-ai-locale";

// Case-insensitive lookup of our (case-sensitive) locale tags: "pt-br" -> "pt-BR".
const byLowerTag = new Map<string, Locale>(
  locales.map((l) => [l.toLowerCase(), l]),
);

// Match a single BCP 47 tag against our supported locales, preferring the most
// specific match: full tag first ("pt-BR", "zh-TW"), then primary subtag
// ("fr-CH" -> "fr", "zh-Hans-CN" -> "zh"). Avoids pulling in a locale matcher.
const matchTag = (tag: string): Locale | null => {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;
  return (
    byLowerTag.get(normalized) ??
    byLowerTag.get(normalized.split("-")[0]) ??
    null
  );
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
