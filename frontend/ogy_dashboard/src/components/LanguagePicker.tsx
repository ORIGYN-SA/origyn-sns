import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { locales } from "@i18n";
import { useLocale, useT } from "@i18n/LocaleContext";
import { rememberLocale } from "@i18n/negotiate";
import { withLocale } from "@i18n/paths";

// Header language switcher: swaps the locale prefix on the current path, keeps
// search/hash, and persists the explicit choice so subsequent visits skip
// negotiation. Renders a real <select> so mobile gets the OS picker for free.
const LanguagePicker = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useLocale();
  const t = useT();

  const go = (code: string) => {
    if (code === locale) return;
    rememberLocale(code as typeof locale);
    navigate(
      `${withLocale(code, location.pathname)}${location.search}${location.hash}`
    );
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={locale}
        onChange={(e) => go(e.target.value)}
        aria-label={t("language.label")}
        className="appearance-none h-10 ps-4 pe-9 rounded-full border border-white/15 bg-transparent text-white/80 text-[14px] font-light hover:text-white hover:border-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 cursor-pointer [&>option]:text-black"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(`language.names.${code}`)}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute end-3 h-4 w-4 text-white/50"
        aria-hidden="true"
      />
      {/* Crawler-visible links for every locale variant of the current page so
          search engines discover translations even without JS. */}
      <nav className="sr-only" aria-hidden="true">
        {locales.map((code) => (
          <a
            key={code}
            href={withLocale(code, location.pathname)}
            hrefLang={code}
            lang={code}
            tabIndex={-1}
            onClick={() => rememberLocale(code as typeof locale)}
          >
            {t(`language.names.${code}`)}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default LanguagePicker;
