import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import styles from "./Header.module.scss";

// Internal items resolve to "/<locale>/<path>" at render time so navigation
// stays inside the active locale. Anchor items target sections on the home
// page; we still link to "/<locale>/#<section>" so cross-page nav works.
const NAV_ITEMS = [
  {
    id: "token",
    labelKey: "nav.token",
    type: "internal",
    path: "token",
    activeWhen: (rest) => rest.startsWith("token"),
  },
  {
    id: "ai",
    labelKey: "nav.ai",
    type: "internal",
    path: "ai",
    activeWhen: (rest) => rest.startsWith("ai"),
  },
  {
    id: "certificates",
    labelKey: "nav.certificates",
    href: "https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity",
    type: "external",
  },
  {
    id: "integrator-program",
    labelKey: "nav.integrators",
    type: "anchor",
    activeWhen: (rest) => rest.startsWith("integrator"),
  },
  {
    id: "use-cases",
    labelKey: "nav.useCases",
    type: "anchor",
    activeWhen: (rest) => rest.startsWith("use-case/"),
  },
  {
    id: "governance",
    labelKey: "nav.governance",
    href: "https://dashboard.origyn.com",
    type: "external",
  },
  {
    id: "help-center",
    labelKey: "nav.help",
    href: "help-center",
    type: "internal",
    path: "help-center",
    activeWhen: (rest) => rest.startsWith("help-center"),
  },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { locale } = useLocale();
  const t = useT();
  const location = useLocation();
  const rest = location.pathname.replace(/^\/[^/]+\/?/, "");
  const isHome = rest === "";

  const handleAnchorClick = (e, sectionId) => {
    setIsMenuOpen(false);
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const renderNavItem = (item) => {
    const isActive = item.activeWhen?.(rest) ?? false;
    const isExternal = item.type === "external";
    const href = (() => {
      if (item.type === "anchor") return `${localePath(locale, "")}#${item.id}`;
      if (item.type === "internal") return localePath(locale, item.path);
      return item.href;
    })();

    return (
      <a
        key={item.id}
        href={href}
        className={`${styles.navLink} ${isActive ? styles.active : ""}`}
        onClick={
          item.type === "anchor"
            ? (e) => handleAnchorClick(e, item.id)
            : undefined
        }
        {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {t(item.labelKey)}
      </a>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a
          href={localePath(locale, "")}
          className={styles.logoContainer}
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <img
            src="/origyn-logo-white.png"
            alt="ORIGYN Logo"
            className={styles.logo}
          />
        </a>
        <button
          className={`${styles.burgerMenu} ${isMenuOpen ? styles.open : ""}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={t("nav.toggleMenu")}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ""}`}>
          {NAV_ITEMS.map(renderNavItem)}
        </nav>
      </div>
    </header>
  );
};

export default Header;
