import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { isLocale } from "./config";
import { LocaleProvider } from "./LocaleContext";
import { useHtmlLang } from "./useHtmlLang";
import { negotiateLocale, rememberLocale } from "./negotiate";
import { localePath } from "./paths";

// Known in-app page segments. Used to recognise the legacy `/page/<locale>`
// form (e.g. /ai/en, which existed before locale moved to the URL prefix).
const KNOWN_PAGES = new Set([
  "ai",
  "dpp",
  "token",
  "help-center",
  "integrator",
  "use-case",
]);

// Catches any URL that isn't already locale-prefixed and routes it to the
// canonical /<locale>/<path>. Mounted at "*" so it picks up "/", "/ai",
// "/ai/en" (legacy), and any other bare path. The IC asset canister cannot do
// server-side negotiation (no middleware) so the redirect runs client-side and
// persists the choice via localStorage to skip subsequent rounds.
export const LocaleRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // Legacy: /<page>/<locale>[/<rest>] -> /<locale>/<page>[/<rest>]. Preserves
  // inbound links from the previous /ai/<locale> URL scheme.
  if (
    segments.length >= 2 &&
    KNOWN_PAGES.has(segments[0]) &&
    isLocale(segments[1])
  ) {
    const [page, lang, ...rest] = segments;
    const tail = rest.length ? `/${rest.join("/")}` : "";
    rememberLocale(lang);
    return (
      <Navigate to={`/${lang}/${page}${tail}${search}${hash}`} replace />
    );
  }

  // Already-prefixed but unmatched paths (e.g. /en/foo/unknown) shouldn't
  // pick up a second locale - send the user to the locale's home instead of
  // looping back through this redirect.
  if (segments.length >= 1 && isLocale(segments[0])) {
    return <Navigate to={`/${segments[0]}/${search}${hash}`} replace />;
  }

  const target = negotiateLocale();
  rememberLocale(target);
  return (
    <Navigate to={`${localePath(target, pathname)}${search}${hash}`} replace />
  );
};

// Wraps every /:locale/* route. Validates the segment, syncs <html lang/dir>,
// and provides the active locale. When :locale isn't a known tag the path is
// really a bare page like "/ai" or "/token" - negotiate a locale and prepend
// it so the page is preserved (e.g. /ai -> /<negotiated>/ai).
const LocaleGate = () => {
  const { locale } = useParams();
  const { pathname, search, hash } = useLocation();

  if (!isLocale(locale)) {
    const target = negotiateLocale();
    rememberLocale(target);
    return (
      <Navigate to={`/${target}${pathname}${search}${hash}`} replace />
    );
  }

  return (
    <LocaleProvider locale={locale}>
      <HtmlLangBinding locale={locale} />
      <Outlet />
    </LocaleProvider>
  );
};

// Thin wrapper so the hook (which holds the only useEffect in this file) sits
// in its own component and the gate stays declarative.
const HtmlLangBinding = ({ locale }) => {
  useHtmlLang(locale);
  return null;
};

export default LocaleGate;
