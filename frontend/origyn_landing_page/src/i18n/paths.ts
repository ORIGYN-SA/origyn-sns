import { isLocale, normalizeLocale, type Locale } from "./config";

// Build a localized in-app href. `target` may be relative ("ai", "/token") or
// absolute ("/integrator/join"); the function always returns "/<locale>/<path>".
export const localePath = (locale: Locale | string | undefined, target: string): string => {
  const active = normalizeLocale(locale);
  const clean = target.replace(/^\/+/, "");
  return clean ? `/${active}/${clean}` : `/${active}/`;
};

// Split a pathname into [maybeLocale, rest]. Returns [null, pathname] when the
// first segment is not a known locale tag (used by the locale gate to decide
// whether to negotiate + redirect).
export const splitLocalePath = (
  pathname: string,
): { locale: Locale | null; rest: string } => {
  const trimmed = pathname.replace(/^\/+/, "");
  if (!trimmed) return { locale: null, rest: "" };
  const slash = trimmed.indexOf("/");
  const head = slash === -1 ? trimmed : trimmed.slice(0, slash);
  const tail = slash === -1 ? "" : trimmed.slice(slash + 1);
  return isLocale(head) ? { locale: head, rest: tail } : { locale: null, rest: trimmed };
};

// Rewrite the locale segment of a pathname, preserving the rest. Used by the
// language picker to switch language while keeping the user on the same page.
export const withLocale = (locale: Locale | string | undefined, pathname: string): string => {
  const { rest } = splitLocalePath(pathname);
  return localePath(locale, rest);
};
