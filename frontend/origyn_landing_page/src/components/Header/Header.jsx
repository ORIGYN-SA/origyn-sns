import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import useMediaQuery from "@/hooks/useMediaQuery";
import {
  AIPage,
  DPPPage,
  HelpCenterPage,
  TokenPage,
} from "@/routes/lazyPages";
import styles from "./Header.module.scss";

// Mirrors $bp-lg in styles/_variables.scss.
const DESKTOP_QUERY = "(min-width: 990px)";

const SOLUTIONS = [
  {
    id: "dpp",
    labelKey: "nav.dpp",
    descriptionKey: "nav.dppDescription",
    type: "internal",
    path: "dpp",
    preload: DPPPage.preload,
    activeWhen: (rest) => rest.startsWith("dpp"),
  },
  {
    id: "certificates",
    labelKey: "nav.certificates",
    descriptionKey: "nav.certificatesDescription",
    type: "external",
    href: "https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity",
  },
  {
    id: "ai",
    labelKey: "nav.ai",
    descriptionKey: "nav.aiDescription",
    type: "internal",
    path: "ai",
    preload: AIPage.preload,
    activeWhen: (rest) => rest.startsWith("ai"),
  },
  {
    id: "use-cases",
    labelKey: "nav.useCases",
    descriptionKey: "nav.useCasesDescription",
    type: "anchor",
    activeWhen: (rest) => rest.startsWith("use-case/"),
  },
];

// Internal items resolve to "/<locale>/<path>" at render time so navigation
// stays inside the active locale. Anchor items target sections on the home
// page with native fragment navigation.
const NAV_ITEMS = [
  {
    id: "solutions",
    labelKey: "nav.solutions",
    type: "group",
    children: SOLUTIONS,
  },
  {
    id: "token",
    labelKey: "nav.token",
    type: "internal",
    path: "token",
    preload: TokenPage.preload,
    activeWhen: (rest) => rest.startsWith("token"),
  },
  {
    id: "integrator-program",
    labelKey: "nav.integrators",
    type: "anchor",
    activeWhen: (rest) => rest.startsWith("integrator"),
  },
  {
    id: "help-center",
    labelKey: "nav.help",
    type: "internal",
    path: "help-center",
    preload: HelpCenterPage.preload,
    activeWhen: (rest) => rest.startsWith("help-center"),
  },
];

const DASHBOARD_LINK = {
  labelKey: "nav.dashboard",
  href: "https://dashboard.origyn.com",
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { locale } = useLocale();
  const t = useT();
  const location = useLocation();
  const rest = location.pathname.replace(/^\/[^/]+\/?/, "");
  const isHome = rest === "";
  const locationKey = `${location.pathname}${location.search}${location.hash}`;
  const [previousLocationKey, setPreviousLocationKey] = useState(locationKey);
  if (previousLocationKey !== locationKey) {
    setPreviousLocationKey(locationKey);
    setIsMenuOpen(false);
    setOpenGroupId(null);
  }

  // Crossing the breakpoint swaps which surface is rendered, so drop both
  // open states rather than let one reappear on the way back.
  const [wasDesktop, setWasDesktop] = useState(isDesktop);
  if (wasDesktop !== isDesktop) {
    setWasDesktop(isDesktop);
    setIsMenuOpen(false);
    setOpenGroupId(null);
  }

  const closeNav = () => {
    setIsMenuOpen(false);
    setOpenGroupId(null);
  };

  const handleInternalClick = () => {
    closeNav();
  };

  const handleAnchorClick = (e, sectionId) => {
    closeNav();
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const hrefFor = (item) => {
    if (item.type === "anchor") return `${localePath(locale, "")}#${item.id}`;
    if (item.type === "internal") return localePath(locale, item.path);
    return item.href;
  };

  const linkProps = (item) => ({
    ...(item.type === "internal"
      ? { to: hrefFor(item) }
      : { href: hrefFor(item) }),
    onClick:
      item.type === "anchor"
        ? (e) => handleAnchorClick(e, item.id)
        : item.type === "internal"
          ? handleInternalClick
          : closeNav,
    ...(item.type === "internal" && {
      onMouseEnter: () => {
        void item.preload();
      },
      onFocus: () => {
        void item.preload();
      },
    }),
    ...(item.type === "external" && {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  });

  // The icon alone is invisible to screen readers, so it carries a
  // visually-hidden label rather than relying on target="_blank" being
  // announced.
  const outboundMark = (
    <>
      <svg
        className={styles.outboundIcon}
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M7 1h4v4M11 1 6 6" />
        <path d="M10 7v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" />
      </svg>
      <span className={styles.srOnly}>{t("nav.opensInNewTab")}</span>
    </>
  );

  const renderLinkElement = (item, key, props, content) =>
    item.type === "internal" ? (
      <Link key={key} {...props}>
        {content}
      </Link>
    ) : (
      <a key={key} {...props}>
        {content}
      </a>
    );

  const renderLink = (item, className) => {
    const props = {
      className: `${className} ${item.activeWhen?.(rest) ? styles.active : ""}`,
      ...linkProps(item),
    };
    return renderLinkElement(
      item,
      item.id,
      props,
      <>
        {t(item.labelKey)}
        {item.type === "external" && outboundMark}
      </>,
    );
  };

  const renderGroup = (item) => {
    const isOpen = openGroupId === item.id;
    const panelId = `nav-panel-${item.id}`;

    return (
      <div
        key={item.id}
        className={styles.group}
        onMouseEnter={() => setOpenGroupId(item.id)}
        onMouseLeave={() => setOpenGroupId(null)}
        onBlur={(e) => {
          // onBlur is focusout, so it bubbles: only close once focus has left
          // the group entirely.
          if (!e.currentTarget.contains(e.relatedTarget)) setOpenGroupId(null);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape" || !isOpen) return;
          setOpenGroupId(null);
          e.currentTarget.querySelector("button")?.focus();
        }}
      >
        <button
          type="button"
          className={`${styles.navLink} ${styles.groupTrigger}`}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setOpenGroupId(isOpen ? null : item.id)}
        >
          {t(item.labelKey)}
          <span className={styles.chevron} aria-hidden="true" />
        </button>
        {/* Stays mounted so the panel can transition; `visibility: hidden`
            keeps its links out of the tab order while closed. */}
        <div
          id={panelId}
          className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        >
          {item.children.map((child) => (
            renderLinkElement(
              child,
              child.id,
              {
                className: `${styles.panelItem} ${child.activeWhen?.(rest) ? styles.active : ""}`,
                ...linkProps(child),
              },
              <>
                <span className={styles.panelItemLabel}>
                  {t(child.labelKey)}
                  {child.type === "external" && outboundMark}
                </span>
                <span className={styles.panelItemDescription}>
                  {t(child.descriptionKey)}
                </span>
              </>,
            )
          ))}
        </div>
      </div>
    );
  };

  const renderNavItem = (item) => {
    if (item.type !== "group") return renderLink(item, styles.navLink);
    if (!isDesktop)
      return item.children.map((child) => renderLink(child, styles.navLink));
    return renderGroup(item);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          to={localePath(locale, "")}
          className={styles.logoContainer}
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              handleInternalClick();
            }
          }}
        >
          <img
            src="/origyn-logo-white.png"
            alt="ORIGYN Logo"
            className={styles.logo}
          />
        </Link>
        <button
          className={`${styles.burgerMenu} ${isMenuOpen ? styles.open : ""}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-label={t("nav.toggleMenu")}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav
          className={`${styles.nav} ${isMenuOpen ? styles.open : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsMenuOpen(false);
          }}
        >
          {NAV_ITEMS.map(renderNavItem)}
          <a
            href={DASHBOARD_LINK.href}
            className={styles.dashboardLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeNav}
          >
            {t(DASHBOARD_LINK.labelKey)}
            {outboundMark}
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
