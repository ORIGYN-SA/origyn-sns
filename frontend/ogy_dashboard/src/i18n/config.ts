// Locale configuration for the OGY dashboard. Hand-rolled (no i18n framework)
// so the catalog, lookup, and negotiation stay explicit and dependency-light.
// Mirrors the origyn_landing_page i18n module so both apps share one mental
// model and the same locale set.

// English first (default + fallback), then alphabetical by tag. Region-tagged
// entries ("pt-BR", "zh-TW") sit next to their base language. Kept in sync with
// the landing page's locale list.
export const locales = [
  "en",
  "ar",
  "bg",
  "bn",
  "cs",
  "da",
  "de",
  "el",
  "es",
  "fi",
  "fr",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "nl",
  "no",
  "pl",
  "pt",
  "pt-BR",
  "ro",
  "ru",
  "sv",
  "sw",
  "th",
  "tl",
  "tr",
  "uk",
  "ur",
  "vi",
  "zh",
  "zh-TW",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Right-to-left scripts. Adding a locale here flips <html dir> (see useHtmlLang)
// so the whole dashboard mirrors. Components should use logical Tailwind
// utilities (ms/me, ps/pe, start/end, text-start/end) so the flip needs no
// per-locale CSS.
const rtlLocales = new Set<Locale>(["ar", "he", "ur"]);

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (locales as readonly string[]).includes(value);

export const normalizeLocale = (value: unknown): Locale =>
  isLocale(value) ? value : defaultLocale;

export const dirFor = (value: unknown): "ltr" | "rtl" =>
  isLocale(value) && rtlLocales.has(value) ? "rtl" : "ltr";

// Walk a dot-path ("a.b.0.c") through nested objects and arrays. Returns
// undefined for any missing segment so callers can fall back to another locale.
export const resolveKey = (source: unknown, path: string): unknown => {
  let cursor: unknown = source;
  for (const part of path.split(".")) {
    if (cursor == null) return undefined;
    if (Array.isArray(cursor)) {
      const idx = Number(part);
      cursor = Number.isInteger(idx) ? cursor[idx] : undefined;
    } else if (typeof cursor === "object") {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cursor;
};
