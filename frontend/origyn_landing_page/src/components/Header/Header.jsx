import { useState } from "react";
import styles from "./Header.module.scss";

const NAV_ITEMS = [
  {
    id: "token",
    label: "TOKEN",
    type: "internal",
    href: "/token",
    activeWhen: (path) => path.startsWith("/token"),
  },
  {
    id: "certificates",
    label: "CERTIFICATES",
    href: "https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity",
    type: "external",
  },
  {
    id: "integrator-program",
    label: "INTEGRATORS",
    type: "anchor",
    activeWhen: (path) => path.startsWith("/integrator"),
  },
  // {
  //   id: "our-partners",
  //   label: "ECOSYSTEM",
  //   type: "anchor",
  // },
  {
    id: "use-cases",
    label: "USE CASES",
    type: "anchor",
    activeWhen: (path) => path.startsWith("/use-case/"),
  },
  // {
  //   id: "ogy-token",
  //   label: "OGY TOKEN",
  //   href: "https://coinmarketcap.com/currencies/origyn-foundation/",
  //   type: "external",
  // },
  {
    id: "governance",
    label: "GOVERNANCE",
    href: "https://dashboard.origyn.com",
    type: "external",
  },
  {
    id: "help-center",
    label: "HELP",
    href: "/help-center",
    type: "internal",
    activeWhen: (path) => path.startsWith("/help-center"),
  },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPath = window.location.pathname;

  const handleAnchorClick = (e, sectionId) => {
    setIsMenuOpen(false);

    if (currentPath === "/") {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const renderNavItem = (item) => {
    const isActive = item.activeWhen?.(currentPath) ?? false;
    const isExternal = item.type === "external";

    return (
      <a
        key={item.id}
        href={item.href ?? `/#${item.id}`}
        className={`${styles.navLink} ${isActive ? styles.active : ""}`}
        onClick={
          item.type === "anchor"
            ? (e) => handleAnchorClick(e, item.id)
            : undefined
        }
        {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a
          href="/"
          className={styles.logoContainer}
          onClick={(e) => {
            if (currentPath === "/") {
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
          aria-label="Toggle menu"
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
