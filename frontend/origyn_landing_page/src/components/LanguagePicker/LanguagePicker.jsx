import { useLocation, useNavigate } from "react-router-dom";
import { locales } from "@/i18n";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { rememberLocale } from "@/i18n/negotiate";
import { withLocale } from "@/i18n/paths";
import styles from "./LanguagePicker.module.scss";

// Header language switcher: swaps the locale prefix on the current path, keeps
// search/hash, and persists the explicit choice so subsequent visits skip
// negotiation. Renders a real <select> so mobile gets the OS picker for free.
const LanguagePicker = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useLocale();
  const t = useT();

  const go = (code) => {
    if (code === locale) return;
    rememberLocale(code);
    navigate(`${withLocale(code, location.pathname)}${location.search}${location.hash}`);
  };

  return (
    <div className={`${styles.picker} ${className ?? ""}`}>
      <select
        value={locale}
        onChange={(e) => go(e.target.value)}
        aria-label={t("language.label")}
        className={styles.select}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(`language.names.${code}`)}
          </option>
        ))}
      </select>
      <svg
        className={styles.chevron}
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 4l3 3 3-3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Crawler-visible links for every locale variant of the current page so
          search engines discover translations even without JS. */}
      <nav className={styles.srOnly} aria-hidden="true">
        {locales.map((code) => (
          <a
            key={code}
            href={withLocale(code, location.pathname)}
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

export default LanguagePicker;
