import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { isLocale } from "./config";
import { LocaleProvider } from "./LocaleContext";
import { useHtmlLang } from "./useHtmlLang";
import { negotiateLocale, rememberLocale } from "./negotiate";
import { localePath } from "./paths";

// Catches any URL that isn't already locale-prefixed and routes it to the
// canonical /<locale>/<path>. Mounted at "*" so it picks up "/", "/governance",
// and any other bare path. The IC asset canister cannot do server-side
// negotiation (no middleware) so the redirect runs client-side and persists the
// choice via localStorage to skip subsequent rounds.
export const LocaleRedirect = () => {
  const { pathname, search, hash } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // Already-prefixed but unmatched paths (e.g. /en/foo/unknown) shouldn't pick
  // up a second locale — send the user to the locale's home instead of looping
  // back through this redirect.
  if (segments.length >= 1 && isLocale(segments[0])) {
    return <Navigate to={`/${segments[0]}${search}${hash}`} replace />;
  }

  const target = negotiateLocale();
  rememberLocale(target);
  return (
    <Navigate
      to={`${localePath(target, pathname)}${search}${hash}`}
      replace
    />
  );
};

// Thin wrapper so the hook (which holds the only useEffect here) sits in its own
// component and the gate stays declarative.
const HtmlLangBinding = ({ locale }: { locale: string }) => {
  useHtmlLang(locale as Parameters<typeof useHtmlLang>[0]);
  return null;
};

// Wraps every /:locale/* route. Validates the segment, syncs <html lang/dir>,
// and provides the active locale. When :locale isn't a known tag the path is
// really a bare page like "/governance" — negotiate a locale and prepend it so
// the page is preserved (e.g. /governance → /<negotiated>/governance).
const LocaleGate = () => {
  const { locale } = useParams();
  const { pathname, search, hash } = useLocation();

  if (!isLocale(locale)) {
    const target = negotiateLocale();
    rememberLocale(target);
    return (
      <Navigate
        to={`/${target}${pathname}${search}${hash}`}
        replace
      />
    );
  }

  return (
    <LocaleProvider locale={locale}>
      <HtmlLangBinding locale={locale} />
      <Outlet />
    </LocaleProvider>
  );
};

export default LocaleGate;
