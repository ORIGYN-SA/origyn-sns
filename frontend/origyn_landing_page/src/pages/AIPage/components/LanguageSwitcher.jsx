import { useNavigate } from "react-router-dom";
import { locales } from "@/i18n";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { rememberLocale } from "@/i18n/negotiate";

const LanguageSwitcher = () => {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const t = useT();

  const go = (code) => {
    if (code === locale) return;
    rememberLocale(code); // persist the explicit choice (event handler, not effect)
    navigate(`/ai/${code}`);
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={locale}
        onChange={(e) => go(e.target.value)}
        aria-label={t("language.label")}
        className="cursor-pointer appearance-none rounded-full bg-black/[0.04] py-1.5 pl-4 pr-9 text-[0.8125rem] tracking-wide text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(`language.names.${code}`)}
          </option>
        ))}
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>

      {/*
        Real, crawler-discoverable links to every localized route. Hidden from
        the accessibility tree (the <select> above is the interactive control)
        and not focusable, so they exist purely so crawlers can find the other
        languages and persist the choice when followed directly.
      */}
      <nav className="sr-only" aria-hidden="true">
        {locales.map((code) => (
          <a
            key={code}
            href={`/ai/${code}`}
            hrefLang={code}
            lang={code}
            tabIndex={-1}
            onClick={() => rememberLocale(code)}
          >
            {t(`language.names.${code}`)}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default LanguageSwitcher;
