// Locale configuration for the AI page. Hand-rolled (no i18n framework) so the
// catalog, lookup, and negotiation stay explicit and dependency-light. Mirrors
// the structure of the bity-landing-page reference, adapted to a React SPA.

export const locales = ["en", "fr", "de", "it", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Right-to-left scripts. None of the current locales are RTL, but keeping the
// plumbing means adding ar/he/ur later is a catalog change, not a code change.
const rtlLocales = new Set<Locale>([]);

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
